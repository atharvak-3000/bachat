import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", params.id)
      .eq("member_id", member.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking notification read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
