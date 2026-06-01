import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const body = await req.json()
    const { role: newRole } = body

    // SUPERADMIN can only assign ADMIN or MEMBER
    // NEVER allow assigning SUPERADMIN via this route
    if (!['ADMIN', 'MEMBER'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only assign ADMIN or MEMBER.' },
        { status: 400 }
      )
    }

    // Cannot change own role
    if (id === performer.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Get target member
    const { data: target, error: targetError } = await supabase
      .from('members')
      .select('id, name, role, organization_id, status')
      .eq('id', id)
      .single()

    if (targetError || !target) return NextResponse.json(
      { error: 'Member not found' }, { status: 404 }
    )

    // Must be same org
    if (target.organization_id !== performer.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, { status: 403 }
      )
    }

    // Cannot touch another SUPERADMIN
    if (target.role === 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Cannot change SuperAdmin role' }, { status: 403 }
      )
    }

    // Must be active
    if (target.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Member must be active' }, { status: 400 }
      )
    }

    const oldRole = target.role

    // Update role
    const { data: updated, error: updateError } = await supabase
      .from('members')
      .update({ role: newRole })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Notify member
    await supabase.from('notifications').insert({
      member_id: id,
      organization_id: performer.organization_id,
      title: 'भूमिका बदलली / Role Updated',
      message: newRole === 'ADMIN'
        ? 'तुम्हाला Admin म्हणून नियुक्त केले आहे. / You have been assigned as Admin.'
        : 'तुमची Admin भूमिका काढली आहे. / Your Admin role has been removed.',
      type: 'ROLE_CHANGED',
    })

    await logActivity(
      supabase, performer.id, performer.organization_id,
      'ROLE_CHANGED', 'member', id,
      { from: oldRole, to: newRole, member_name: target.name }
    )

    return NextResponse.json({ 
      ...updated,
      roleChanged: true,
      message: 'Role updated. Member must sign out and sign in again to see changes.'
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (error.message === 'FORBIDDEN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[ROLE_CHANGE]', error)
    return NextResponse.json(
      { error: 'Failed to update role' }, { status: 500 }
    )
  }
}
