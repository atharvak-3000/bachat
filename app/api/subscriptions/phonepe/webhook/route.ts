import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyChecksum } from "@/lib/phonepe"

export async function POST(req: Request) {
  try {
    const xVerify = req.headers.get("x-verify")
    if (!xVerify) {
      return NextResponse.json({ error: "Missing x-verify header" }, { status: 400 })
    }

    // Capture the raw body text for verification
    const rawBody = await req.text()
    const isChecksumValid = verifyChecksum(xVerify, rawBody)

    if (!isChecksumValid) {
      return NextResponse.json({ error: "Invalid checksum" }, { status: 401 })
    }

    // Parse envelope body to get base64 response payload
    const body = JSON.parse(rawBody)
    if (!body.response) {
      return NextResponse.json({ error: "Invalid webhook payload structure" }, { status: 400 })
    }

    // Decode base64 payload
    const decodedString = Buffer.from(body.response, "base64").toString("utf8")
    const responseData = JSON.parse(decodedString)

    const merchantTransactionId = responseData.merchantTransactionId
    if (!merchantTransactionId) {
      return NextResponse.json({ error: "Missing merchantTransactionId in response" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Find the pending subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("id, organization_id, plan, status")
      .eq("phonepe_merchant_transaction_id", merchantTransactionId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "Subscription record not found" }, { status: 404 })
    }

    // If subscription is already ACTIVE, return success immediately (idempotency)
    if (subscription.status === "ACTIVE") {
      return NextResponse.json({ success: true })
    }

    const isSuccess = responseData.responseCode === "SUCCESS" || 
      responseData.state === "COMPLETED" || 
      responseData.code === "PAYMENT_SUCCESS"

    if (isSuccess) {
      const now = new Date()
      const expiresAt = new Date()
      expiresAt.setDate(now.getDate() + 30)

      // 1. Update subscription status
      const { error: updateSubError } = await adminSupabase
        .from("subscriptions")
        .update({
          status: "ACTIVE",
          phonepe_transaction_id: responseData.transactionId || null,
          payment_method: responseData.paymentInstrument?.type || null,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq("id", subscription.id)

      if (updateSubError) throw updateSubError

      // 2. Update organization status
      const { error: updateOrgError } = await adminSupabase
        .from("organizations")
        .update({
          subscription_plan: subscription.plan,
          subscription_status: "ACTIVE",
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq("id", subscription.organization_id)

      if (updateOrgError) throw updateOrgError

    } else {
      // Update subscription status to FAILED
      await adminSupabase
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
