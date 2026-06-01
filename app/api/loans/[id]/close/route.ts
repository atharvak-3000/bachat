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

    if (loan.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE loans can be closed' }, { status: 400 })
    }

    // Update loan ACTIVE -> CLOSED, outstanding to 0
    const { data: updatedLoan, error: updateError } = await supabase
      .from("loans")
      .update({
        status: 'CLOSED',
        outstanding_amount: 0
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Set all pending emis as PAID
    const { error: emiError } = await supabase
      .from("loan_emis")
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString()
      })
      .eq("loan_id", id)
      .neq("status", "PAID")

    if (emiError) throw emiError

    // Notify member
    await supabase.from("notifications").insert({
      member_id: loan.member_id,
      organization_id: performer.organization_id,
      title: 'Loan Closed / कर्ज बंद झाले',
      message: `Your loan of ₹${loan.loan_amount / 100} has been marked as CLOSED. Thank you.`,
      type: 'LOAN_APPROVED',
      is_read: false
    })

    // Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_CLOSED', 'loan', loan.id, {
      member_id: loan.member_id,
      amount: loan.loan_amount
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to close loan' }, { status: 500 })
  }
}
