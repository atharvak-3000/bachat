import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = await params

    // Fetch loan and verify org
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*, member:members!loans_member_id_fkey(*)")
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

    // Update status PENDING -> ACTIVE
    const { data: updatedLoan, error: updateError } = await supabase
      .from("loans")
      .update({
        status: 'ACTIVE',
        outstanding_amount: loan.loan_amount,
        approved_by: performer.id,
        approved_at: new Date().toISOString(),
        disbursed_date: new Date().toISOString().split('T')[0] // Set disbursement date to today
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Generate EMI schedule -> insert
    const emis = calcEmiSchedule(
      loan.loan_amount,
      loan.interest_rate || 2.0,
      loan.term_months || 12,
      new Date()
    )

    const emiInserts = emis.map(e => ({
      ...e,
      loan_id: loan.id
    }))

    const { error: emiError } = await supabase
      .from("loan_emis")
      .insert(emiInserts)

    if (emiError) throw emiError

    // Notify member
    await supabase.from("notifications").insert({
      member_id: loan.member_id,
      organization_id: performer.organization_id,
      title: 'Loan Approved / कर्ज मंजूर झाले',
      message: `Your loan request of ₹${loan.loan_amount / 100} has been approved by the SuperAdmin.`,
      type: 'LOAN_APPROVED',
      is_read: false
    })

    // Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_APPROVED', 'loan', loan.id, {
      member_id: loan.member_id,
      amount: loan.loan_amount
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to approve loan' }, { status: 500 })
  }
}
