import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("organization_id", performer.organization_id)
      .order("member_number", { ascending: true })
    if (error) throw error
    const filtered = status ? (data ?? []).filter((m) => m.status === status) : data
    return NextResponse.json(filtered)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const body = await req.json()
    const { name, name_marathi, phone, password, address, joining_date } = body

    if (!name || !phone || !password) return NextResponse.json({ error: 'Name, phone, and password required' }, { status: 400 })
    if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    // Check organization active member limits if subscription is ACTIVE or TRIAL
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("max_members, subscription_plan, subscription_status")
      .eq("id", performer.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (org.subscription_status === "ACTIVE" || org.subscription_status === "TRIAL") {
      const { count, error: countError } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", performer.organization_id)
        .eq("status", "ACTIVE")

      if (countError) {
        return NextResponse.json({ error: "Failed to count active members" }, { status: 500 })
      }

      const activeMembers = count || 0
      const maxMembers = org.max_members || 10
      if (activeMembers >= maxMembers) {
        return NextResponse.json({
          error: "MEMBER_LIMIT_REACHED",
          message: "You have reached your plan limit. Please upgrade your subscription.",
          currentPlan: org.subscription_plan || "BASIC",
          maxMembers: maxMembers
        }, { status: 403 })
      }
    }

    // Validation: Check if a member with this phone number already exists in this Gat
    const { data: existingPhone } = await supabase
      .from("members")
      .select("id")
      .eq("organization_id", performer.organization_id)
      .eq("phone", phone)
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json({ error: 'A member with this phone number already exists in your Gat' }, { status: 400 })
    }

    // Use admin client to create auth user
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const fakeEmail = `91${phone}@bachatbook.app`

    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find((u: any) => u.email === fakeEmail)

    let authUserId: string
    if (existingAuthUser) {
      await adminClient.auth.admin.updateUserById(existingAuthUser.id, { password })
      authUserId = existingAuthUser.id
    } else {
      const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
        email: fakeEmail,
        password,
        email_confirm: true,
        user_metadata: { name, phone }
      })
      if (authError) throw new Error('Failed to create login account: ' + authError.message)
      authUserId = newUser.user!.id
    }

    const { data: lastMember } = await supabase
      .from("members").select("member_number").eq("organization_id", performer.organization_id).order("member_number", { ascending: false }).limit(1).maybeSingle()
    const next_number = (lastMember?.member_number ?? 0) + 1

    const { data: member, error } = await supabase
      .from("members")
      .insert({ organization_id: performer.organization_id, user_id: authUserId, name, name_marathi: name_marathi || '', phone, address: address || '', joining_date: joining_date || new Date().toISOString().split('T')[0], member_number: next_number, role: 'MEMBER', status: 'ACTIVE', is_active: true })
      .select().single()
    if (error) throw error

    await logActivity(supabase, performer.id, performer.organization_id, 'MEMBER_ADDED', 'member', member.id, { name, member_number: next_number })
    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
