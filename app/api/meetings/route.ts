import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"
import { calcMeetingTotals, getNextMonthStart, addP } from "@/lib/calculations"

export async function GET(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()

    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("organization_id", performer.organization_id)
      .order("month_year", { ascending: false })

    if (error) throw error
    return NextResponse.json(meetings || [])
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const body = await req.json()
    const { meeting_date, opening_balance } = body

    if (!meeting_date) {
      return NextResponse.json({ error: 'Meeting date is required' }, { status: 400 })
    }

    // Generate unique month_year using date + timestamp
    // so multiple meetings can exist for same month
    const meetingDate = new Date(meeting_date)
    const month_year = `${meetingDate.getFullYear()}-${String(
      meetingDate.getMonth() + 1).padStart(2, '0')}-${Date.now()}`

    // Auto-fetch closing balance of last finalized meeting
    const { data: lastMeeting } = await supabase
      .from('meetings')
      .select('id, month_year, status, opening_balance, meeting_date')
      .eq('organization_id', performer.organization_id)
      .eq('status', 'FINALIZED')
      .order('month_year', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Default to the client-provided opening balance (converted to paise)
    let opening_balance_calculated = typeof opening_balance === 'number' ? opening_balance : 0

    if (lastMeeting) {
      // Recalculate closing balance of last meeting to get accurate carry-forward
      const { data: lastContribs } = await supabase
        .from('meeting_contributions')
        .select('savings_amount, loan_repayment, interest_paid, penalty_paid, other_amount, is_present')
        .eq('meeting_id', lastMeeting.id)

      const { data: lastExpenses } = await supabase
        .from('meeting_expenses')
        .select('amount')
        .eq('meeting_id', lastMeeting.id)

      const { data: lastIncome } = await supabase
        .from('meeting_income')
        .select('amount')
        .eq('meeting_id', lastMeeting.id)

      const { data: lastLoans } = await supabase
        .from('loans')
        .select('loan_amount')
        .eq('organization_id', performer.organization_id)
        // Loans disbursed in that meeting's month
        .gte('disbursed_date', lastMeeting.meeting_date)
        .lt('disbursed_date', getNextMonthStart(lastMeeting.meeting_date))
        .in('status', ['ACTIVE', 'CLOSED'])

      const totals = calcMeetingTotals({
        opening_balance: lastMeeting.opening_balance,
        contributions: lastContribs || [],
        loans_issued_total: addP(...(lastLoans || []).map((l: any) => l.loan_amount)),
        other_expenses_total: addP(...(lastExpenses || []).map((e: any) => e.amount)),
        other_income_total: addP(...(lastIncome || []).map((i: any) => i.amount))
      })

      opening_balance_calculated = Math.max(0, totals.closing_balance)
    }

    // Get organization default savings
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("monthly_saving_amount")
      .eq("id", performer.organization_id)
      .single()

    if (orgError) throw orgError

    // 2. Insert meeting
    const { data: meeting, error: insertError } = await supabase
      .from("meetings")
      .insert({
        organization_id: performer.organization_id,
        meeting_date,
        month_year,
        opening_balance: opening_balance_calculated,
        status: 'DRAFT',
        created_by: performer.id
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. Fetch all ACTIVE members in this organization
    const { data: activeMembers, error: membersError } = await supabase
      .from("members")
      .select("id")
      .eq("organization_id", performer.organization_id)
      .eq("status", "ACTIVE")
      .eq("is_active", true)

    if (membersError) throw membersError

    // 4. Bulk insert contributions (one per member)
    if (activeMembers && activeMembers.length > 0) {
      const contributions = activeMembers.map(m => ({
        meeting_id: meeting.id,
        member_id: m.id,
        savings_amount: org.monthly_saving_amount || 0,
        loan_repayment: 0,
        interest_paid: 0,
        penalty_paid: 0,
        other_amount: 0,
        is_present: true
      }))

      const { error: contribError } = await supabase
        .from("meeting_contributions")
        .insert(contributions)

      if (contribError) throw contribError
    }

    // 5. Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'MEETING_CREATED', 'meeting', meeting.id, {
      month_year,
      meeting_date
    })

    return NextResponse.json(meeting)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}
