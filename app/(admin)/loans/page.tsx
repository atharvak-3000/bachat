import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import LoansClient from "./LoansClient"

export default async function AdminLoansPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const { tab } = await searchParams
  const supabase = await createClient()

  // Fetch loans with member names
  const { data: loans, error: loansError } = await supabase
    .from("loans")
    .select("*, member:members!loans_member_id_fkey(*)")
    .eq("organization_id", performer.organization_id)
    .order("created_at", { ascending: false })

  if (loansError) {
    console.error("Failed to fetch loans:", loansError)
  }

  // Fetch overdue EMIs for these loans
  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0]

  const { data: emis, error: emisError } = await supabase
    .from("loan_emis")
    .select("loan_id, status, due_date")

  if (emisError) {
    console.error("Failed to fetch emis:", emisError)
  }

  const loansList = loans || []
  const emisList = emis || []

  // Compute overdue count per loan
  const overdueCountMap: Record<string, number> = {}
  loansList.forEach(l => {
    const loanEmis = emisList.filter(e => e.loan_id === l.id)
    const overdueCount = loanEmis.filter(e => 
      e.status === 'OVERDUE' || (e.status !== 'PAID' && e.due_date < todayStr)
    ).length
    overdueCountMap[l.id] = overdueCount
  })

  // Format response data
  const loansWithOverdue = loansList.map(l => ({
    ...l,
    overdue_count: overdueCountMap[l.id] || 0
  }))

  return (
    <LoansClient
      loans={loansWithOverdue}
      currentRole={performer.role}
      activeTab={tab || "all"}
    />
  )
}
