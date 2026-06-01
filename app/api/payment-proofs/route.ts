import { NextResponse } from "next/server"
import { getCurrentMember, requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrAbove()
    const supabase = await createClient()

    const { data: proofs, error } = await supabase
      .from("payment_proofs")
      .select("*, member:members(name, member_number), meeting:meetings(month_year)")
      .eq("organization_id", admin.organization_id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ proofs })
  } catch (error: any) {
    console.error("Error fetching payment proofs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()
    const body = await request.json()
    const { amount, upi_reference, meeting_id, screenshot_url } = body

    if (!amount || amount <= 0 || !screenshot_url) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from("payment_proofs")
      .insert({
        organization_id: member.organization_id,
        member_id: member.id,
        meeting_id: meeting_id || null,
        amount,
        upi_reference,
        screenshot_url,
        status: "PENDING"
      })

    if (insertError) throw insertError

    // Notify Admins
    // We can fetch admins and insert notifications, or skip for now if notifications aren't fully set up.
    // The instructions say "Notify admins" but that might be implemented later.
    const { data: admins } = await supabase
      .from("members")
      .select("id")
      .eq("organization_id", member.organization_id)
      .in("role", ["SUPERADMIN", "ADMIN"])

    if (admins) {
      const notifications = admins.map(admin => ({
        organization_id: member.organization_id,
        member_id: admin.id,
        title: "New Payment Proof",
        message: `New payment proof of ₹${(amount / 100).toFixed(2)} from ${member.name}`,
        type: "GENERAL"
      }))
      await supabase.from("notifications").insert(notifications)
    }

    await supabase.from("activity_logs").insert({
      organization_id: member.organization_id,
      performed_by: member.id,
      action: "PAYMENT_PROOF_SUBMITTED",
      entity_type: "payment_proofs",
      entity_id: null,
      details: { amount }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error submitting payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
