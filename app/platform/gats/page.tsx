import { createAdminClient } from "@/lib/supabase/admin"
import GatsClient from "./GatsClient"

export default async function PlatformGatsPage() {
  const adminClient = createAdminClient()

  const { data: orgs } = await adminClient
    .from("organizations")
    .select("*, members(id)")
    .order("created_at", { ascending: false })

  const formattedOrgs = (orgs || []).map(org => ({
    ...org,
    members_count: org.members?.length || 0
  }))

  return <GatsClient initialOrgs={formattedOrgs} />
}
