import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()
    const { category, amount, description } = body // amount is in paise

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    // Check meeting status (must be DRAFT)
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
      return NextResponse.json({ error: 'Cannot add expense to finalized meeting' }, { status: 400 })
    }

    const { data: expense, error: insertError } = await supabase
      .from("meeting_expenses")
      .insert({
        meeting_id: id,
        category: category || 'MISCELLANEOUS',
        amount,
        description: description || ''
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 })
  }
}
