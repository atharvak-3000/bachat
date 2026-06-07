import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current authenticated user's organization
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single()

    if (memberError || !member || !member.organization_id) {
      return NextResponse.json({ error: "Organization not found for this user" }, { status: 404 })
    }

    // Only SUPERADMIN or ADMIN can start a trial
    if (member.role !== "SUPERADMIN" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can start a free trial" }, { status: 403 })
    }

    const body = await req.json()
    const { plan, maxMembers } = body

    if (!plan || !maxMembers || !["BASIC", "STANDARD", "PREMIUM"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan or members count request payload" }, { status: 400 })
    }

    const now = new Date()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(now.getDate() + 7)

    const adminSupabase = createAdminClient()

    // 1. Update the organization record with trial details
    const { error: orgError } = await adminSupabase
      .from("organizations")
      .update({
        subscription_plan: plan,
        subscription_status: "TRIAL",
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_expires_at: trialEndsAt.toISOString(),
        max_members: maxMembers
      })
      .eq("id", member.organization_id)

    if (orgError) {
      throw new Error(`Failed to update organization: ${orgError.message}`)
    }

    // Retrieve corresponding price
    const amount = plan === "BASIC" ? 15000 : plan === "STANDARD" ? 25000 : 50000

    // 2. Insert record in subscriptions table with TRIAL status
    const { error: subError } = await adminSupabase
      .from("subscriptions")
      .insert({
        organization_id: member.organization_id,
        plan: plan,
        amount: amount,
        max_members: maxMembers,
        status: "TRIAL",
        phonepe_merchant_transaction_id: `TRIAL_${member.organization_id.replace(/-/g, "").substring(0, 10)}_${Date.now()}`.toUpperCase(),
        starts_at: now.toISOString(),
        expires_at: trialEndsAt.toISOString(),
        payment_method: "TRIAL"
      })

    if (subError) {
      throw new Error(`Failed to log subscription audit row: ${subError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
