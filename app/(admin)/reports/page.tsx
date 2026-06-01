import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import ReportsClient from "./ReportsClient"
import { MeetingWithDetails, Member, LoanWithEmis, Organization } from "@/types"

export default async function ReportsPage() {
  let currentMember
  try {
    currentMember = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  // Fetch all necessary data for the reports
  const [
    { data: meetingsData },
    { data: membersData },
    { data: loansData },
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select(`
        *,
        meeting_contributions (*, member:members (*)),
        meeting_expenses (*),
        meeting_income (*)
      `)
      .eq("organization_id", currentMember.organization_id)
      .order("meeting_date", { ascending: false }),
    supabase
      .from("members")
      .select("*")
      .eq("organization_id", currentMember.organization_id)
      .eq("is_active", true)
      .order("member_number"),
    supabase
      .from("loans")
      .select(`
        *,
        member:members!loans_member_id_fkey (*),
        loan_emis (*)
      `)
      .eq("organization_id", currentMember.organization_id)
      .order("created_at", { ascending: false }),
  ])

  return (
    <ReportsClient 
      meetings={(meetingsData ?? []) as MeetingWithDetails[]}
      members={(membersData ?? []) as Member[]}
      loans={(loansData ?? []) as LoanWithEmis[]}
      organization={currentMember.organization as Organization}
    />
  )
}
