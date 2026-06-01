import { NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const admin = await requireAdminOrAbove()
    const supabase = await createClient()
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const { data: proof, error: fetchError } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("id", params.id)
      .eq("organization_id", admin.organization_id)
      .single()

    if (fetchError || !proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 })
    }

    if (proof.status !== 'PENDING') {
      return NextResponse.json({ error: "Proof is not pending" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("payment_proofs")
      .update({
        status: "REJECTED",
        rejection_reason: reason
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    // Notify member
    await supabase.from("notifications").insert({
      organization_id: admin.organization_id,
      member_id: proof.member_id,
      title: "Payment Proof Rejected",
      message: `Your payment proof of ₹${(proof.amount / 100).toFixed(2)} was rejected. Reason: ${reason}`,
      type: "GENERAL"
    })

    await supabase.from("activity_logs").insert({
      organization_id: admin.organization_id,
      performed_by: admin.id,
      action: "PAYMENT_REJECTED",
      entity_type: "payment_proofs",
      entity_id: params.id,
      details: { amount: proof.amount, reason }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error rejecting payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
