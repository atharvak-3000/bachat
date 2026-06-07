import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateStatusChecksum, MERCHANT_ID, BASE_URL } from "@/lib/phonepe"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  try {
    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=no_transaction_id`, 303)
    }

    const adminSupabase = createAdminClient()

    // Retrieve subscription details to check current status
    const { data: subscription, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("id, organization_id, plan, status")
      .eq("phonepe_merchant_transaction_id", transactionId)
      .single()

    if (subError || !subscription) {
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=subscription_not_found`, 303)
    }

    // If already updated to ACTIVE by webhook, redirect to success directly
    if (subscription.status === "ACTIVE") {
      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`, 303)
    }

    // Query PhonePe Status API
    const checksum = generateStatusChecksum(transactionId)
    const response = await fetch(`${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID
      }
    })

    if (!response.ok) {
      // API call failed, mark subscription as FAILED
      await adminSupabase
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id)

      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=status_check_failed`, 303)
    }

    const responseData = await response.json()
    const isSuccess = responseData.success === true && 
      (responseData.code === "PAYMENT_SUCCESS" || responseData.data?.responseCode === "SUCCESS" || responseData.data?.state === "COMPLETED")

    if (isSuccess) {
      const now = new Date()
      const expiresAt = new Date()
      expiresAt.setDate(now.getDate() + 30)

      // 1. Update subscription status
      const { error: updateSubError } = await adminSupabase
        .from("subscriptions")
        .update({
          status: "ACTIVE",
          phonepe_transaction_id: responseData.data?.transactionId || null,
          payment_method: responseData.data?.paymentInstrument?.type || null,
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

      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`, 303)
    } else {
      // Payment failed at PhonePe
      await adminSupabase
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id)

      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed`, 303)
    }
  } catch (error: any) {
    return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=internal_error`, 303)
  }
}
