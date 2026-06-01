import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"
import { toP } from "@/lib/calculations"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string, emiId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id, emiId } = await params
    const body = await req.json()
    
    const { principal_paid, interest_paid } = body // in rupees

    const pPaid = toP(principal_paid || 0)
    const iPaid = toP(interest_paid || 0)

    // 1. Fetch loan and verify org
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
      return NextResponse.json({ error: 'Cannot record EMI payment for non-ACTIVE loans' }, { status: 400 })
    }

    // 2. Fetch EMI
    const { data: emi, error: emiError } = await supabase
      .from("loan_emis")
      .select("*")
      .eq("id", emiId)
      .eq("loan_id", id)
      .maybeSingle()

    if (emiError) throw emiError
    if (!emi) {
      return NextResponse.json({ error: 'EMI record not found' }, { status: 404 })
    }

    // 3. Compute updated values
    const updatedPrincipalPaid = emi.principal_paid + pPaid
    const updatedInterestPaid = emi.interest_paid + iPaid
    const isFullyPaid = updatedPrincipalPaid >= emi.principal_due && updatedInterestPaid >= emi.interest_due
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIAL'

    // Update EMI
    const { data: updatedEmi, error: emiUpdateError } = await supabase
      .from("loan_emis")
      .update({
        principal_paid: updatedPrincipalPaid,
        interest_paid: updatedInterestPaid,
        status: newStatus,
        paid_at: isFullyPaid ? new Date().toISOString() : emi.paid_at
      })
      .eq("id", emiId)
      .select()
      .single()

    if (emiUpdateError) throw emiUpdateError

    // 4. Update Loan Outstanding
    const newOutstanding = Math.max(0, loan.outstanding_amount - pPaid)
    
    // Check if all EMIs are PAID
    const { data: allEmis } = await supabase
      .from("loan_emis")
      .select("status")
      .eq("loan_id", id)

    const allPaid = allEmis ? allEmis.every(e => e.status === 'PAID') : false
    const isClosed = newOutstanding === 0 || allPaid

    const { error: loanUpdateError } = await supabase
      .from("loans")
      .update({
        outstanding_amount: newOutstanding,
        status: isClosed ? 'CLOSED' : 'ACTIVE'
      })
      .eq("id", id)

    if (loanUpdateError) throw loanUpdateError

    // 5. Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'EMI_PAYMENT_RECORDED', 'loan', loan.id, {
      member_id: loan.member_id,
      emi_id: emiId,
      principal_paid: pPaid,
      interest_paid: iPaid,
      outstanding_remaining: newOutstanding,
      is_closed: isClosed
    })

    return NextResponse.json({
      emi: updatedEmi,
      outstanding_amount: newOutstanding,
      status: isClosed ? 'CLOSED' : 'ACTIVE'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to record EMI payment' }, { status: 500 })
  }
}
