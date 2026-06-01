import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logActivity, requireSuperAdmin, requireAdminOrAbove } from "@/lib/auth"

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    let reason = ""
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      reason = ((await req.json()) as { reason?: string }).reason ?? ""
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      reason = String(form.get("reason") ?? "")
    }
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()

    const { data: target } = await supabase
      .from("members")
      .select("id,name,status,organization_id")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (target.status !== "PENDING" && target.status !== "ACTIVE") return NextResponse.json({ error: "Member must be pending or active" }, { status: 400 })

    const { error: updateError } = await supabase
      .from("members")
      .update({ status: "REJECTED", is_active: false })
      .eq("id", target.id)
      .eq("organization_id", performer.organization_id)
    if (updateError) throw updateError

    await supabase.from("notifications").insert({
      member_id: target.id,
      organization_id: performer.organization_id,
      title: "Request Not Approved",
      message: `Your request was not approved. Reason: ${reason || "Not provided"}`,
      type: "GENERAL",
    })

    await logActivity(supabase, performer.id, performer.organization_id, "MEMBER_REJECTED", "member", target.id, {
      member_name: target.name,
      reason: reason ?? "",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHENTICATED" || error.message === "UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_REJECT_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
