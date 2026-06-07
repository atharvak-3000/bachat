import { redirect } from "next/navigation"
import { requireSuperAdmin } from "@/lib/auth"
import SettingsClient from "./SettingsClient"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  let performer
  try {
    performer = await requireSuperAdmin()
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') redirect("/dashboard")
    redirect("/sign-in")
  }

  const supabase = await createClient()
  const { data: admins } = await supabase
    .from("members")
    .select("*")
    .eq("organization_id", performer.organization_id)
    .eq("role", "SUPERADMIN")

  // Count active members in this organization
  const { count: activeMemberCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", performer.organization_id)
    .eq("status", "ACTIVE")

  return <SettingsClient 
    organization={performer.organization} 
    orgId={performer.organization_id} 
    admins={admins || []} 
    activeMemberCount={activeMemberCount || 0}
  />
}
