import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, requireAdminOrAbove, requireAuth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

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

    const [
      { data: contributions },
      { data: expenses },
      { data: income },
      { data: allLoans },
      { data: orgSettings }
    ] = await Promise.all([
      supabase
        .from("meeting_contributions")
        .select("*, member:members(*)")
        .eq("meeting_id", id),
      supabase
        .from("meeting_expenses")
        .select("*")
        .eq("meeting_id", id),
      supabase
        .from("meeting_income")
        .select("*")
        .eq("meeting_id", id),
      supabase
        .from("loans")
        .select("*, member:members!loans_member_id_fkey(*)")
        .eq("organization_id", performer.organization_id),
      supabase
        .from("organizations")
        .select("*")
        .eq("id", performer.organization_id)
        .single()
    ])

    // "loans issued this meeting" could be loans created/disbursed on meeting_date or with matching purpose/notes
    // Let's filter loans where disbursed_date = meeting.meeting_date
    const loansIssued = (allLoans || []).filter(l => l.disbursed_date === meeting.meeting_date)

    // Outstanding loans list (ACTIVE) for outstanding hints
    const activeLoans = (allLoans || []).filter(l => l.status === 'ACTIVE')

    return NextResponse.json({
      meeting,
      contributions: contributions || [],
      expenses: expenses || [],
      income: income || [],
      loans_issued: loansIssued,
      active_loans: activeLoans,
      org_settings: orgSettings
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch meeting details' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()
    const { notes, opening_balance } = body

    const { data: meeting, error: fetchError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (meeting.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized meeting' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (notes !== undefined) updates.notes = notes
    if (opening_balance !== undefined) updates.opening_balance = opening_balance

    const { data: updatedMeeting, error: updateError } = await supabase
      .from("meetings")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedMeeting)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}
