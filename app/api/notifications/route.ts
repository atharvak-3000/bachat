import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const isCount = searchParams.get("count") === "true"
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const supabase = await createClient()

    if (isCount) {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("member_id", member.id)
        .eq("is_read", false)

      if (error) throw error
      return NextResponse.json({ unread_count: count || 0 })
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
