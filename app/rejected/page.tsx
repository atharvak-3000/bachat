import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import RejectedClient from "./RejectedClient"

export default async function RejectedPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const supabase = await createClient()

  // Get member info for context
  const { data: member } = await supabase
    .from('members')
    .select('name, organization:organizations(name)')
    .eq('user_id', user.id)
    .maybeSingle()

  const orgName = (member?.organization as any)?.name || 'the group'
  const memberName = member?.name || ''

  return (
    <RejectedClient
      orgName={orgName}
      memberName={memberName}
    />
  )
}
