import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()

    const { data: target, error: targetError } = await supabase
      .from("members").select("id, name, role, organization_id").eq("id", id).single()

    if (targetError || !target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.organization_id !== performer.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (id === performer.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
    }
    if (target.role === 'SUPERADMIN') {
      return NextResponse.json({ error: 'Cannot remove SuperAdmin' }, { status: 403 })
    }
    if (performer.role === 'SUPERADMIN' && target.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Admins can only deactivate Members' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from("members").update({ is_active: false }).eq("id", id)
    if (updateError) throw updateError

    await logActivity(supabase, performer.id, performer.organization_id, 'MEMBER_DEACTIVATED', 'member', id, {
      name: target.name, role: target.role,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to deactivate member' }, { status: 500 })
  }
}
