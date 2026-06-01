import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== process.env.PLATFORM_OWNER_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("organizations")
      .update({ is_approved: true })
      .eq("id", params.id)

    if (error) throw error

    // Fetch superadmin to notify
    const { data: superadmin } = await adminClient
      .from("members")
      .select("id")
      .eq("organization_id", params.id)
      .eq("role", "SUPERADMIN")
      .single()

    if (superadmin) {
      await adminClient.from("notifications").insert({
        organization_id: params.id,
        member_id: superadmin.id,
        title: "Gat Approved 🎉",
        message: "Your Bachat Gat has been approved! You can now start using all features.",
        type: "GENERAL"
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error approving gat:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
