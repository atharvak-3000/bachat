import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logActivity, requireSuperAdmin, requireAdminOrAbove } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()

    const { data: target } = await supabase
      .from("members")
      .select("id,name,role,status,organization_id")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (target.status !== "PENDING") return NextResponse.json({ error: "Member is not pending" }, { status: 400 })
    if (target.role !== "MEMBER") return NextResponse.json({ error: "Invalid role for approval" }, { status: 400 })

    const { error: updateError } = await supabase
      .from("members")
      .update({ status: "ACTIVE", is_active: true })
      .eq("id", target.id)
      .eq("organization_id", performer.organization_id)
    if (updateError) throw updateError

    await supabase.from("notifications").insert({
      member_id: target.id,
      organization_id: performer.organization_id,
      title: "Request Approved!",
      message: `Welcome to ${performer.organization.name}! You can now login.`,
      type: "GENERAL",
    })

    await logActivity(supabase, performer.id, performer.organization_id, "MEMBER_APPROVED", "member", target.id, {
      member_name: target.name,
      approved_by: performer.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHENTICATED" || error.message === "UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_APPROVE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
