import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()

    const [{ data: member }, { data: contributions }, { data: loans }] = await Promise.all([
      supabase.from('members').select('*').eq('organization_id', performer.organization_id).eq('id', id).maybeSingle(),
      supabase.from('meeting_contributions').select('*').eq('member_id', id),
      supabase.from('loans').select('*').eq('organization_id', performer.organization_id).eq('member_id', id),
    ])

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    return NextResponse.json({ member, contributions: contributions ?? [], loans: loans ?? [] })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error('[MEMBER_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const body = await req.json()

    const allowedBase = ['name', 'phone', 'address', 'name_marathi']
    const allowedSuper = ['joining_date']
    const allowed = performer.role === 'SUPERADMIN' ? [...allowedBase, ...allowedSuper] : allowedBase

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data: updated, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', performer.organization_id)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!updated) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    await logActivity(supabase, performer.id, performer.organization_id, 'MEMBER_UPDATED', 'member', id, updates)

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error('[MEMBER_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
