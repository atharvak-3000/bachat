import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: proofs, error } = await supabase
      .from("payment_proofs")
      .select("*, meeting:meetings(month_year)")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ proofs })
  } catch (error: any) {
    console.error("Error fetching self payment proofs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
