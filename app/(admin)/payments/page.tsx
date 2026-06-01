import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import AdminPaymentsClient from "./AdminPaymentsClient"

export default async function AdminPaymentsPage() {
  let currentAdmin
  try {
    currentAdmin = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  const { data: proofs, error } = await supabase
    .from("payment_proofs")
    .select("*, member:members(name, member_number), meeting:meetings(month_year)")
    .eq("organization_id", currentAdmin.organization_id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching proofs:", error)
  }

  return <AdminPaymentsClient proofs={proofs || []} />
}
