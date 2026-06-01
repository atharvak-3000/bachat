import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { toP } from "@/lib/calculations"

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const body = await req.json()

    const allowedFields = ['name', 'village', 'taluka', 'district', 'meeting_frequency', 'monthly_saving_amount', 'default_interest_rate', 'default_penalty_amount', 'max_loan_limit', 'logo_url']

    if (id !== performer.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['monthly_saving_amount', 'default_penalty_amount', 'max_loan_limit'].includes(field)) {
          updates[field] = toP(body[field] as number)
        } else {
          updates[field] = body[field]
        }
      }
    }

    const { data, error } = await supabase.from("organizations").update(updates).eq("id", id).select().single()
    if (error) throw error

    await logActivity(supabase, performer.id, performer.organization_id, 'SETTINGS_UPDATED', 'organization', id, updates)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}
