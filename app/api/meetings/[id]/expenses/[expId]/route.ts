import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, expId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id, expId } = await params

    // Verify meeting status and tenant
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
      return NextResponse.json({ error: 'Cannot delete expense from finalized meeting' }, { status: 400 })
    }

    const { data: expense, error: fetchExpenseError } = await supabase
      .from("meeting_expenses")
      .select("*")
      .eq("id", expId)
      .eq("meeting_id", id)
      .maybeSingle()

    if (fetchExpenseError) throw fetchExpenseError
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from("meeting_expenses")
      .delete()
      .eq("id", expId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
