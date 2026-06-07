import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPlanForMembers, generateChecksum, MERCHANT_ID, BASE_URL, PLANS } from "@/lib/phonepe"

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

    // Only SUPERADMIN or ADMIN can initiate subscription payments
    if (member.role !== "SUPERADMIN" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can manage subscriptions" }, { status: 403 })
    }

    // Count active members in the organization
    const { count, error: countError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", member.organization_id)
      .eq("status", "ACTIVE")

    if (countError) {
      return NextResponse.json({ error: "Failed to count active members" }, { status: 500 })
    }

    let planId: string | undefined
    try {
      const body = await req.json()
      planId = body.planId
    } catch {
      // Body might be empty
    }

    const memberCount = count || 0
    let plan = getPlanForMembers(memberCount)

    if (planId) {
      const selectedPlan = PLANS[planId as keyof typeof PLANS]
      if (!selectedPlan) {
        return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
      }
      if (memberCount > selectedPlan.maxMembers) {
        return NextResponse.json({
          error: `Selected plan allows up to ${selectedPlan.maxMembers} members, but you have ${memberCount} active members.`
        }, { status: 400 })
      }
      plan = selectedPlan
    }

    // Generate unique merchantTransactionId
    const cleanOrgId = member.organization_id.replace(/-/g, "").substring(0, 10)
    const merchantTransactionId = `TXN${cleanOrgId}${Date.now()}`.toUpperCase()

    // Create a PENDING record in subscriptions table
    const { data: subscription, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        organization_id: member.organization_id,
        plan: plan.id,
        amount: plan.amount,
        max_members: plan.maxMembers,
        status: "PENDING",
        phonepe_merchant_transaction_id: merchantTransactionId,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: `Failed to create subscription record: ${insertError.message}` }, { status: 500 })
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const appUrl = host 
      ? `${proto}://${host}` 
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    const redirectUrl = `${appUrl}/api/subscriptions/phonepe/callback?transactionId=${merchantTransactionId}`
    const callbackUrl = `${appUrl}/api/subscriptions/phonepe/webhook`

    // Format phonepe payment payload
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `MUID${member.organization_id.replace(/-/g, "").substring(0, 20)}`.toUpperCase(),
      amount: plan.amount,
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    }

    const { base64Payload, checksum } = generateChecksum(payload, "/pg/v1/pay")

    // Call PhonePe sandbox payment API
    const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "Accept": "application/json"
      },
      body: JSON.stringify({ request: base64Payload })
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Mark subscription as FAILED
      await supabase
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id)

      return NextResponse.json({ error: `PhonePe API error: ${errorText}` }, { status: 502 })
    }

    const responseData = await response.json()

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      return NextResponse.json({ url: responseData.data.instrumentResponse.redirectInfo.url })
    } else {
      // Mark subscription as FAILED
      await supabase
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id)

      return NextResponse.json({ error: responseData.message || "Failed to initiate transaction" }, { status: 502 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
