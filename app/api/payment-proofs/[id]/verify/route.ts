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
        status: "VERIFIED",
        verified_by: admin.id,
        verified_at: new Date().toISOString()
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    // Auto-match meeting contribution if meeting_id exists
    if (proof.meeting_id) {
      const { data: contrib } = await supabase
        .from("meeting_contributions")
        .select("id, savings_amount, other_amount")
        .eq("meeting_id", proof.meeting_id)
        .eq("member_id", proof.member_id)
        .single()

      if (contrib) {
        // Simple logic: add to savings if not fully covered, else other
        // Let's just add to savings for now as per instructions "Update savings_amount or other_amount"
        await supabase
          .from("meeting_contributions")
          .update({ savings_amount: contrib.savings_amount + proof.amount })
          .eq("id", contrib.id)
      }
    }

    // Notify member
    await supabase.from("notifications").insert({
      organization_id: admin.organization_id,
      member_id: proof.member_id,
      title: "Payment Verified",
      message: `Your payment of ₹${(proof.amount / 100).toFixed(2)} has been verified.`,
      type: "PAYMENT_VERIFIED"
    })

    await supabase.from("activity_logs").insert({
      organization_id: admin.organization_id,
      performed_by: admin.id,
      action: "PAYMENT_VERIFIED",
      entity_type: "payment_proofs",
      entity_id: params.id,
      details: { amount: proof.amount }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error verifying payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
