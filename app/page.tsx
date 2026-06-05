import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import LandingClient from './LandingClient'

export default async function RootPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  let isAuthenticated = false
  let role: string | null = null
  let status: string | null = null

  if (user) {
    isAuthenticated = true
    const { data: member } = await supabase
      .from('members')
      .select('role, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (member) {
      role = member.role
      status = member.status
    }
  }

  return (
    <LandingClient 
      isAuthenticated={isAuthenticated}
      role={role}
      status={status}
    />
  )
}
