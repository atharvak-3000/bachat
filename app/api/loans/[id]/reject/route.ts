import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()
    const { reason } = body

    // Fetch loan
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (loanError) throw loanError
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json({ error: 'Loan is not in PENDING status' }, { status: 400 })
    }

    const { data: updatedLoan, error: updateError } = await supabase
      .from("loans")
      .update({
        status: 'REJECTED',
        rejection_reason: reason || 'Not specified'
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Notify member
    await supabase.from("notifications").insert({
      member_id: loan.member_id,
      organization_id: performer.organization_id,
      title: 'Loan Request Rejected / कर्ज नाकारले',
      message: `Your loan request of ₹${loan.loan_amount / 100} has been rejected. Reason: ${reason || 'Not specified'}`,
      type: 'LOAN_REJECTED',
      is_read: false
    })

    // Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_REJECTED', 'loan', loan.id, {
      member_id: loan.member_id,
      amount: loan.loan_amount,
      reason
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to reject loan' }, { status: 500 })
  }
}
