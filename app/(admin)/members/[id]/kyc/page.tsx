import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import AdminKycClient from "./AdminKycClient"
import type { Member } from "@/types"

export default async function AdminKycPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentAdmin = await requireAdminOrAbove()
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("organization_id", currentAdmin.organization_id)
    .single()

  if (error || !member) {
    redirect("/members")
  }

  return <AdminKycClient member={member as Member} />
}
