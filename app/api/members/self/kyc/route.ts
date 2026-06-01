import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { aadhaar_url, pan_url, photo_url, signature_url } = body

    const updates: any = {}
    if (aadhaar_url !== undefined) updates.aadhaar_url = aadhaar_url
    if (pan_url !== undefined) updates.pan_url = pan_url
    if (photo_url !== undefined) updates.photo_url = photo_url
    if (signature_url !== undefined) updates.signature_url = signature_url

    // Check if we need to auto-submit
    const { data: currentMember, error: fetchError } = await supabase
      .from("members")
      .select("aadhaar_url, pan_url, photo_url, signature_url")
      .eq("id", member.id)
      .single()

    if (fetchError || !currentMember) {
      return NextResponse.json({ error: "Failed to fetch member" }, { status: 404 })
    }

    const aUrl = updates.aadhaar_url ?? currentMember.aadhaar_url
    const pUrl = updates.pan_url ?? currentMember.pan_url
    const phUrl = updates.photo_url ?? currentMember.photo_url
    const sUrl = updates.signature_url ?? currentMember.signature_url

    if (aUrl && pUrl && phUrl && sUrl) {
      updates.kyc_status = 'SUBMITTED'
    }

    const { error: updateError } = await supabase
      .from("members")
      .update(updates)
      .eq("id", member.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, status: updates.kyc_status })
  } catch (error: any) {
    console.error("Error updating self KYC:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
