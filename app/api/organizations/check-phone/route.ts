import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const phone = searchParams.get('phone')

  if (!orgId || !phone) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data: member } = await adminSupabase
    .from('members')
    .select('id, user_id, name')
    .eq('organization_id', orgId)
    .eq('phone', phone)
    .maybeSingle()

  if (!member) {
    // Phone not in this org at all — free to use
    return NextResponse.json({ exists: false, hasAccount: false })
  }

  if (member.user_id) {
    // Phone exists AND has auth account — blocked
    return NextResponse.json({ exists: true, hasAccount: true })
  }

  // Phone exists but admin pre-added (no auth yet) — allowed to link
  return NextResponse.json({ 
    exists: true, 
    hasAccount: false,
    memberName: member.name // show them who they'll be linked as
  })
}
