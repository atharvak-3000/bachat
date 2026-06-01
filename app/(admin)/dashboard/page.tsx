import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { ActivityLog, Member, Meeting, Loan, LoanEmi } from "@/types"
import { getCurrentMonthYear, calcMeetingTotals } from "@/lib/calculations"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  // 1. Fetch data in parallel
  const [
    { data: allMembers },
    { data: meetings },
    { data: loans },
    { data: recentLogs }
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("organization_id", performer.organization_id)
      .order("member_number"),
    supabase
      .from("meetings")
      .select("*")
      .eq("organization_id", performer.organization_id)
      .order("month_year", { ascending: false }),
    supabase
      .from("loans")
      .select("*, member:members!loans_member_id_fkey(*)")
      .eq("organization_id", performer.organization_id),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("organization_id", performer.organization_id)
      .order("created_at", { ascending: false })
      .limit(10)
  ])

  const membersList = (allMembers || []) as Member[]
  const meetingsList = (meetings || []) as Meeting[]
  const loansList = (loans || []) as (Loan & { member: Member })[]
  const logsList = (recentLogs || []) as ActivityLog[]

  const activeMembers = membersList.filter(m => m.status === 'ACTIVE' && m.is_active)
  const pendingMembers = membersList.filter(m => m.status === 'PENDING')
  
  // Fetch expenses and incomes to get exact meeting receipts & closing balance
  const { data: expenses } = await supabase
    .from("meeting_expenses")
    .select("meeting_id, amount")
  const { data: incomes } = await supabase
    .from("meeting_income")
    .select("meeting_id, amount")

  const exps = expenses || []
  const incs = incomes || []

  // 2. Fetch all contributions for corpus calc
  const memberIds = activeMembers.map(m => m.id)
  let allContributions: any[] = []
  
  if (memberIds.length > 0) {
    const { data: contribs } = await supabase
      .from("meeting_contributions")
      .select("savings_amount, penalty_paid, loan_repayment, interest_paid, other_amount, meeting_id")
      .in("member_id", memberIds)
    
    allContributions = contribs || []
  }

  // Total Corpus = closing balance of latest FINALIZED meeting
  let totalCorpus = 0

  const finalizedMeetings = meetingsList
    .filter(m => m.status === 'FINALIZED')
    .sort((a, b) => 
      new Date(b.meeting_date).getTime() - 
      new Date(a.meeting_date).getTime()
    )

  if (finalizedMeetings.length > 0) {
    const latestMeeting = finalizedMeetings[0]
    
    // Get contributions for latest meeting
    const { data: latestContribs } = await supabase
      .from('meeting_contributions')
      .select('savings_amount, penalty_paid, loan_repayment, interest_paid, other_amount, is_present')
      .eq('meeting_id', latestMeeting.id)

    const latestExps = exps
      .filter(e => e.meeting_id === latestMeeting.id)
      .reduce((sum, e) => sum + e.amount, 0)
    
    const latestIncs = incs
      .filter(i => i.meeting_id === latestMeeting.id)
      .reduce((sum, i) => sum + i.amount, 0)

    const latestLoans = loansList
      .filter(l => 
        l.disbursed_date === latestMeeting.meeting_date && 
        l.status === 'ACTIVE'
      )
      .reduce((sum, l) => sum + l.loan_amount, 0)

    const totals = calcMeetingTotals({
      opening_balance: latestMeeting.opening_balance,
      contributions: (latestContribs || []).map((c: any) => ({
        savings_amount: c.savings_amount || 0,
        loan_repayment: c.loan_repayment || 0,
        interest_paid: c.interest_paid || 0,
        penalty_paid: c.penalty_paid || 0,
        other_amount: c.other_amount || 0,
        is_present: c.is_present ?? true,
      })),
      loans_issued_total: latestLoans,
      other_expenses_total: latestExps,
      other_income_total: latestIncs,
    })

    totalCorpus = totals.closing_balance
  }

  const activeLoans = loansList.filter(l => l.status === 'ACTIVE')
  const pendingLoans = loansList.filter(l => l.status === 'PENDING')
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstanding_amount || 0), 0)

  // Current Month/Year meeting check
  const currentMonth = getCurrentMonthYear()
  const currentMeeting = meetingsList.find(m => m.month_year === currentMonth)
  const pendingLoanCount = pendingLoans.length

  // Fetch overdue EMI count per loan
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: overdueEmis } = await supabase
    .from("loan_emis")
    .select("loan_id, due_date")
    .neq("status", "PAID")
    .lt("due_date", todayStr)

  const overdueEmiList = (overdueEmis || []) as Pick<LoanEmi, 'loan_id' | 'due_date'>[]
  
  // Calculate overdue loans list
  const overdueLoansList = activeLoans.map(l => {
    const loanOverdues = overdueEmiList.filter(e => e.loan_id === l.id)
    if (loanOverdues.length === 0) return null
    
    // Calculate max days overdue
    const earliestDueDate = new Date(Math.min(...loanOverdues.map(e => new Date(e.due_date).getTime())))
    const daysOverdue = Math.floor((Date.now() - earliestDueDate.getTime()) / 86400000)

    return {
      ...l,
      days_overdue: daysOverdue,
      overdue_count: loanOverdues.length
    }
  }).filter(Boolean) as (Loan & { member: Member; days_overdue: number; overdue_count: number })[]

  // Computed meetings (last 5)
  const recentMeetings = meetingsList.slice(0, 5).map(m => {
    const mContribs = allContributions.filter(c => c.meeting_id === m.id)
    const mExps = exps.filter(e => e.meeting_id === m.id).reduce((sum, e) => sum + e.amount, 0)
    const mIncs = incs.filter(i => i.meeting_id === m.id).reduce((sum, i) => sum + i.amount, 0)
    
    // active issued loans disbursed in this meeting
    const mLoans = loansList
      .filter(l => l.disbursed_date === m.meeting_date && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.loan_amount, 0)

    const totals = calcMeetingTotals({
      opening_balance: m.opening_balance,
      contributions: mContribs,
      loans_issued_total: mLoans,
      other_expenses_total: mExps,
      other_income_total: mIncs,
    })

    return {
      ...m,
      total_collected: totals.total_receipts,
      closing_balance: totals.closing_balance
    }
  })

  return (
    <DashboardClient
      performer={performer}
      activeMembers={activeMembers}
      pendingMembers={pendingMembers}
      totalCorpus={totalCorpus}
      totalOutstanding={totalOutstanding}
      activeLoans={activeLoans}
      pendingLoanCount={pendingLoanCount}
      currentMonth={currentMonth}
      currentMeeting={currentMeeting}
      overdueLoansList={overdueLoansList}
      recentMeetings={recentMeetings}
      logsList={logsList}
    />
  )
}
