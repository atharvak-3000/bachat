import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cache } from "react"
import type { Member, Organization } from "@/types"

export type MemberWithOrg = Member & { organization: Organization }

export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch (err) {
    return null
  }
})

export const getCurrentMember = cache(async (): Promise<MemberWithOrg | null> => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data } = await supabase
      .from('members')
      .select(`
        id, name, phone, role, status, is_active,
        member_number, joining_date, organization_id,
        kyc_status, kyc_notes,
        organization:organizations(
          id, name, group_code, village, taluka, district,
          monthly_saving_amount, default_interest_rate,
          default_penalty_amount, max_loan_limit,
          subscription_plan, logo_url, meeting_frequency
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    return (data as MemberWithOrg | null) ?? null
  } catch (err) {
    return null
  }
})

export async function getAuthForApi() {
  const supabase = await createClient()
  const member = await getCurrentMember()
  return { member, supabase }
}

export async function requireSuperAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'SUPERADMIN') {
    throw new Error('FORBIDDEN')
  }
  return member
}

// NEW — Check if SUPERADMIN or ADMIN
export async function requireAdminOrAbove() {
  const member = await getCurrentMember()
  if (!member) throw new Error('UNAUTHENTICATED')
  if (!['SUPERADMIN', 'ADMIN'].includes(member.role)) {
    throw new Error('FORBIDDEN')
  }
  return member
}

// NEW — permission helpers (use these in UI + API)
export const isSuperAdmin = (role: string) => role === 'SUPERADMIN'
export const isAdminOrAbove = (role: string) => 
  ['SUPERADMIN', 'ADMIN'].includes(role)
export const isMember = (role: string) => role === 'MEMBER'

export async function requireAuth() {
  const member = await getCurrentMember()
  if (!member) throw new Error('UNAUTHORIZED')
  return member
}

// Helper used in API routes
export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  performedBy: string,
  organizationId: string,
  action: string,
  entityType = "",
  entityId: string | null = null,
  details: Record<string, unknown> = {}
) {
  await supabase.from("activity_logs").insert({
    performed_by: performedBy,
    organization_id: organizationId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
}
