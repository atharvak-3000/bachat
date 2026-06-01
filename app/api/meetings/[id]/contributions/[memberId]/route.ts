import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id, memberId } = await params
    const body = await req.json()
    
    // Validate amounts
    const {
      savings_amount,
      loan_repayment,
      interest_paid,
      penalty_paid,
      other_amount,
      is_present
    } = body

    // 1. Get meeting and verify organization & DRAFT status
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (meetingError) throw meetingError
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (meeting.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized meeting contributions' }, { status: 400 })
    }

    // Verify member belongs to organization
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("id", memberId)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (memberError) throw memberError
    if (!member) {
      return NextResponse.json({ error: 'Member not found in this organization' }, { status: 404 })
    }

    const updates: Record<string, any> = {}

    for (const [key, val] of Object.entries({ savings_amount, loan_repayment, interest_paid, penalty_paid, other_amount })) {
      if (val !== undefined) {
        if (typeof val !== 'number' || val < 0 || !Number.isInteger(val)) {
          return NextResponse.json({ error: `${key} must be a non-negative integer (paise)` }, { status: 400 })
        }
        updates[key] = val
      }
    }

    if (is_present !== undefined) {
      updates.is_present = is_present
    }

    const { data: updatedContribution, error: contribUpdateError } = await supabase
      .from("meeting_contributions")
      .update(updates)
      .eq("meeting_id", id)
      .eq("member_id", memberId)
      .select()
      .single()

    if (contribUpdateError) throw contribUpdateError

    return NextResponse.json(updatedContribution)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 })
  }
}
