import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logActivity } from "@/lib/auth"
import { toP } from "@/lib/calculations"

function generateGroupCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from("members").select("id").eq("user_id", user.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Already registered' }, { status: 400 })

    const body = await req.json()
    const { name, village, taluka, district, monthly_saving_amount, default_interest_rate, default_penalty_amount, max_loan_limit, meeting_frequency } = body

    let group_code = generateGroupCode()
    let codeExists = true
    while (codeExists) {
      const { data } = await supabase.from("organizations").select("id").eq("group_code", group_code).maybeSingle()
      if (!data) codeExists = false
      else group_code = generateGroupCode()
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name, group_code, village, taluka: taluka || '', district, monthly_saving_amount: toP(monthly_saving_amount), default_interest_rate: default_interest_rate || 2.0, default_penalty_amount: toP(default_penalty_amount), max_loan_limit: toP(max_loan_limit), meeting_frequency: meeting_frequency || 'MONTHLY' })
      .select().single()
    if (orgError) throw orgError

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({ organization_id: org.id, user_id: user.id, name: user.user_metadata?.name || 'SuperAdmin', phone: user.user_metadata?.phone || '', member_number: 1, role: 'SUPERADMIN', is_active: true, status: 'ACTIVE' })
      .select().single()
    if (memberError) throw memberError

    await logActivity(supabase, member.id, org.id, 'GAT_CREATED', 'organization', org.id, { name, group_code })

    return NextResponse.json({ organization_id: org.id, group_code: org.group_code })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
