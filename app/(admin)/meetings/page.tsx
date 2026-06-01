import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { calcMeetingTotals } from "@/lib/calculations"
import MeetingsClient from "./MeetingsClient"

export default async function MeetingsPage() {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  // Fetch meetings
  const { data: meetings, error: meetingsError } = await supabase
    .from("meetings")
    .select("*")
    .eq("organization_id", performer.organization_id)
    .order("month_year", { ascending: false })

  if (meetingsError) {
    console.error("Failed to fetch meetings:", meetingsError)
  }

  const { data: contributions } = await supabase
    .from("meeting_contributions")
    .select("meeting_id, savings_amount, penalty_paid, loan_repayment, interest_paid, other_amount, is_present")

  const { data: expenses } = await supabase
    .from("meeting_expenses")
    .select("meeting_id, amount")

  const { data: income } = await supabase
    .from("meeting_income")
    .select("meeting_id, amount")

  const { data: loans } = await supabase
    .from("loans")
    .select("loan_amount, status, disbursed_date")
    .eq("organization_id", performer.organization_id)

  const list = meetings || []
  const contribs = contributions || []
  const exps = expenses || []
  const incs = income || []
  const activeLoans = loans || []

  const meetingsWithTotals = list.map((m) => {
    const mContribs = contribs.filter((c) => c.meeting_id === m.id).map((c) => ({
      savings_amount: c.savings_amount || 0,
      loan_repayment: c.loan_repayment || 0,
      interest_paid: c.interest_paid || 0,
      penalty_paid: c.penalty_paid || 0,
      other_amount: c.other_amount || 0,
      is_present: !!c.is_present,
    }))
    const mExps = exps.filter((e) => e.meeting_id === m.id).reduce((sum, e) => sum + e.amount, 0)
    const mIncs = incs.filter((i) => i.meeting_id === m.id).reduce((sum, i) => sum + i.amount, 0)
    
    // Issued loans: disbursed on meeting date and active
    const mLoans = activeLoans
      .filter((l) => l.disbursed_date === m.meeting_date && l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.loan_amount, 0)

    const totals = calcMeetingTotals({
      opening_balance: m.opening_balance || 0,
      contributions: mContribs,
      loans_issued_total: mLoans,
      other_expenses_total: mExps,
      other_income_total: mIncs,
    })

    return {
      ...m,
      totals,
    }
  })

  return <MeetingsClient initialMeetings={meetingsWithTotals} />
}
