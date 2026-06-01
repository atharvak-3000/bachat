import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getAuthForApi, forbidden } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { member, supabase } = await getAuthForApi()
    if (!member || !['SUPERADMIN', 'ADMIN'].includes(member.role)) return forbidden()

    const { id } = await params
    const { status, notes } = await req.json()
    
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase.from('members').update({
      kyc_status: status,
      kyc_notes: notes || '',
      kyc_verified_by: member.id,
      kyc_verified_at: new Date().toISOString()
    }).eq('id', id)
      .eq('organization_id', member.organization_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update KYC status' }, { status: 500 })
  }
}
