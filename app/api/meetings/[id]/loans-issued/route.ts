import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id: meetingId } = await params
    const body = await req.json()
    const { member_id, amount, interest_rate, purpose, term_months } = body

    // Validate required fields
    if (!member_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'member_id and amount are required' },
        { status: 400 }
      )
    }

    // Get meeting — must be DRAFT and same org
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id, status, organization_id, meeting_date')
      .eq('id', meetingId)
      .eq('organization_id', performer.organization_id)
      .single()

    if (!meeting) return NextResponse.json(
      { error: 'Meeting not found' }, { status: 404 }
    )
    if (meeting.status === 'FINALIZED') return NextResponse.json(
      { error: 'Cannot edit finalized meeting' }, { status: 400 }
    )

    // Get target member — NO is_active filter in query
    const { data: targetMember, error: targetError } = await supabase
      .from('members')
      .select('id, name, status, is_active, organization_id')
      .eq('id', member_id)
      .maybeSingle()

    if (targetError) {
      console.error('[LOANS_ISSUED_DEBUG] Query error:', targetError)
      throw targetError
    }

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Step 3: Org check using string comparison (both must be non-null and equal)
    if (!targetMember.organization_id || !performer.organization_id ||
        targetMember.organization_id !== performer.organization_id) {
      console.error('[LOANS_ISSUED_DEBUG] Tenant mismatch:', {
        target_org: targetMember.organization_id,
        performer_org: performer.organization_id
      })
      return NextResponse.json(
        { error: 'Member not found in your organization' },
        { status: 403 }
      )
    }

    // Treat null as active (backward compat)
    const isActive = targetMember.is_active !== false &&
      (!targetMember.status || targetMember.status === 'ACTIVE')

    if (!isActive) {
      return NextResponse.json(
        { error: 'Member is not active' },
        { status: 400 }
      )
    }

    // Check no existing active loan
    const { data: existingLoan } = await supabase
      .from('loans')
      .select('id')
      .eq('member_id', member_id)
      .eq('organization_id', performer.organization_id)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (existingLoan) return NextResponse.json(
      { error: 'Member already has an active loan' },
      { status: 400 }
    )

    // Convert amount to paise
    const loanAmountPaise = Number(amount)

    // Check max loan limit
    if (performer.organization.max_loan_limit > 0 &&
        loanAmountPaise > performer.organization.max_loan_limit) {
      return NextResponse.json(
        { error: `Exceeds max loan limit of ₹${
            performer.organization.max_loan_limit / 100
          }` },
        { status: 400 }
      )
    }

    // Determine status based on role
    const loanStatus = performer.role === 'SUPERADMIN'
      ? 'ACTIVE' : 'PENDING'

    // Insert loan
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        organization_id: performer.organization_id,
        member_id,
        loan_amount: loanAmountPaise,
        outstanding_amount: loanAmountPaise,
        interest_rate: Number(interest_rate) || 2.0,
        disbursed_date: meeting.meeting_date,
        purpose: purpose || '',
        term_months: Number(term_months) || 12,
        status: loanStatus,
        requested_by: performer.id,
        approved_by: loanStatus === 'ACTIVE' ? performer.id : null,
        approved_at: loanStatus === 'ACTIVE' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (loanError) throw loanError

    // If ACTIVE (SuperAdmin issued): generate EMI schedule
    if (loanStatus === 'ACTIVE') {
      const emis = calcEmiSchedule(
        loanAmountPaise,
        Number(interest_rate) || 2.0,
        Number(term_months) || 12,
        new Date(meeting.meeting_date)
      )
      const emisWithLoanId = emis.map(e => ({
        ...e, loan_id: loan.id
      }))
      await supabase.from('loan_emis').insert(emisWithLoanId)
    }

    // Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_ISSUED', 'loan', loan.id, {
      member_name: targetMember.name,
      amount: loanAmountPaise,
      status: loanStatus
    })

    return NextResponse.json(loan)

  } catch (err) {
    console.error('[LOANS_ISSUED]', err)
    return NextResponse.json(
      { error: 'Internal server error' }, { status: 500 }
    )
  }
}
