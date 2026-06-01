import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireSuperAdmin()
    const supabase = await createClient()

    const { data: target } = await supabase
      .from("members")
      .select("id, name, role, organization_id")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (id === performer.id) return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 })
    if (performer.role === "SUPERADMIN" && target.role !== "MEMBER") {
      return NextResponse.json({ error: "Admins can only deactivate members" }, { status: 403 })
    }

    const { error } = await supabase
      .from("members")
      .update({ is_active: false, status: "REJECTED" })
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
    if (error) throw error

    await logActivity(supabase, performer.id, performer.organization_id, "MEMBER_DEACTIVATED", "member", id, {
      member_name: target.name,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHENTICATED" || error.message === "UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_DEACTIVATE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
