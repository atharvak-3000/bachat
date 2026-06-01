import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import LoanEmisClient from "./LoanEmisClient"

export default async function AdminLoanDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const { id } = await params
  const supabase = await createClient()

  // Fetch loan with member details
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*, member:members!loans_member_id_fkey(*)")
    .eq("id", id)
    .eq("organization_id", performer.organization_id)
    .maybeSingle()

  if (loanError || !loan) {
    redirect("/loans")
  }

  // Fetch EMI list
  const { data: emis, error: emisError } = await supabase
    .from("loan_emis")
    .select("*")
    .eq("loan_id", id)
    .order("month_year", { ascending: true })

  if (emisError) {
    console.error("Failed to fetch emis:", emisError)
  }

  return (
    <LoanEmisClient
      loan={loan}
      initialEmis={emis || []}
    />
  )
}
