import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import AdminLayoutClient from "@/components/shared/AdminLayoutClient"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember()

  if (!member) redirect("/onboarding")
  // Both MEMBER role redirected to member portal
  if (member.role === "MEMBER") redirect("/member")
  // ADMIN and SUPERADMIN both allowed through to /dashboard

  const supabase = await createClient()
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", member.organization_id)
    .eq("status", "PENDING")

  return (
    <AdminLayoutClient member={member} pendingCount={count ?? 0}>
      {children}
    </AdminLayoutClient>
  )
}
