import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"
import { calcMeetingTotals } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = await params
    const { closing_date } = await req.json().catch(() => ({}))

    // 1. Get meeting -> must be DRAFT
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (meetingError) throw meetingError
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (meeting.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot finalize already finalized meeting' }, { status: 400 })
    }

    // 2. Get contributions + expenses + income + issued loans
    const [
      { data: contributions },
      { data: expenses },
      { data: income },
      { data: loans }
    ] = await Promise.all([
      supabase
        .from("meeting_contributions")
        .select("*")
        .eq("meeting_id", id),
      supabase
        .from("meeting_expenses")
        .select("*")
        .eq("meeting_id", id),
      supabase
        .from("meeting_income")
        .select("*")
        .eq("meeting_id", id),
      supabase
        .from("loans")
        .select("*")
        .eq("organization_id", performer.organization_id)
    ])

    const contribs = contributions || []
    const exps = expenses || []
    const incs = income || []
    const allLoans = loans || []

    // Issued loans in this meeting: disbursed on meeting date and is ACTIVE (loans issued in meeting by SuperAdmin are ACTIVE, others are PENDING)
    const activeIssuedLoans = allLoans.filter(l => l.disbursed_date === meeting.meeting_date && l.status === 'ACTIVE')
    const loansIssuedAmount = activeIssuedLoans.reduce((sum, l) => sum + l.loan_amount, 0)

    const totalExpenses = exps.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = incs.reduce((sum, i) => sum + i.amount, 0)

    // 3. calcMeetingTotals -> closing_balance must be >= 0
    const totals = calcMeetingTotals({
      opening_balance: meeting.opening_balance,
      contributions: contribs.map((c: any) => ({
        savings_amount: c.savings_amount || 0,
        loan_repayment: c.loan_repayment || 0,
        interest_paid: c.interest_paid || 0,
        penalty_paid: c.penalty_paid || 0,
        other_amount: c.other_amount || 0,
        is_present: c.is_present ?? true,
      })),
      loans_issued_total: loansIssuedAmount,
      other_expenses_total: totalExpenses,
      other_income_total: totalIncome,
    })

    if (totals.closing_balance < 0) {
      return NextResponse.json({ error: 'Negative closing balance — cannot finalize meeting' }, { status: 400 })
    }

    // 4. Set status = FINALIZED
    const { data: finalizedMeeting, error: finalizeError } = await supabase
      .from("meetings")
      .update({ 
        status: 'FINALIZED',
        closing_date: closing_date || new Date().toISOString().split('T')[0]
      })
      .eq("id", id)
      .select()
      .single()

    if (finalizeError) throw finalizeError

    // 5. For each contribution with loan_repayment > 0 or interest_paid > 0
    for (const c of contribs) {
      if (c.loan_repayment > 0 || c.interest_paid > 0) {
        // Find member's ACTIVE loan
        const { data: activeLoan, error: activeLoanError } = await supabase
          .from("loans")
          .select("*")
          .eq("member_id", c.member_id)
          .eq("status", "ACTIVE")
          .maybeSingle()

        if (activeLoanError) console.error(activeLoanError)

        if (activeLoan) {
          const repaymentRemaining = c.loan_repayment || 0
          const interestPaidRemaining = c.interest_paid || 0

          const newOutstanding = Math.max(0, activeLoan.outstanding_amount - repaymentRemaining)
          const isClosed = newOutstanding === 0

          const { error: loanUpdateError } = await supabase
            .from("loans")
            .update({
              outstanding_amount: newOutstanding,
              status: isClosed ? 'CLOSED' : 'ACTIVE'
            })
            .eq("id", activeLoan.id)

          if (loanUpdateError) console.error(loanUpdateError)

          // Find PENDING or PARTIAL or OVERDUE emi for this month_year
          const { data: emi, error: emiFetchError } = await supabase
            .from("loan_emis")
            .select("*")
            .eq("loan_id", activeLoan.id)
            .eq("month_year", meeting.month_year)
            .maybeSingle()

          if (emiFetchError) console.error(emiFetchError)

          if (emi) {
            const principal_paid = emi.principal_paid + repaymentRemaining
            const interest_paid = emi.interest_paid + interestPaidRemaining
            const isPaidFull = principal_paid >= emi.principal_due && interest_paid >= emi.interest_due

            const { error: emiUpdateError } = await supabase
              .from("loan_emis")
              .update({
                principal_paid,
                interest_paid,
                status: isPaidFull ? 'PAID' : (principal_paid > 0 || interest_paid > 0 ? 'PARTIAL' : 'PENDING'),
                paid_at: isPaidFull ? new Date().toISOString() : emi.paid_at
              })
              .eq("id", emi.id)

            if (emiUpdateError) console.error(emiUpdateError)
          }

          // If loan is fully closed, mark all pending emis as PAID
          if (isClosed) {
            await supabase
              .from("loan_emis")
              .update({ status: 'PAID', paid_at: new Date().toISOString() })
              .eq("loan_id", activeLoan.id)
              .neq("status", "PAID")
          }
        }
      }
    }

    // 6. Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'MEETING_FINALIZED', 'meeting', finalizedMeeting.id, {
      month_year: finalizedMeeting.month_year,
      closing_balance: totals.closing_balance
    })

    return NextResponse.json(finalizedMeeting)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to finalize meeting' }, { status: 500 })
  }
}
