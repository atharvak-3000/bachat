import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { userId, orgId, name, phone } = await req.json()
    console.log('Join API called with payload:', { userId, orgId, name, phone });
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    if (!userId || !orgId || !phone || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Double check user session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if member exists with this phone (admin pre-added)
    const { data: existing, error: findError } = await adminSupabase
      .from('members')
      .select('id, status, user_id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .maybeSingle()
    
    if (findError) throw findError

    if (existing) {
      // Phone exists in this org

      // Case 1: Already linked to an auth account (user_id set)
      // Someone else owns this phone — block them
      if (existing.user_id && existing.user_id !== userId) {
        return NextResponse.json(
          { error: 'This phone number is already registered in this group. Please use a different number.' },
          { status: 409 }
        )
      }

      // Case 2: Admin pre-added this member (no user_id yet)
      // Link auth account but DO NOT override the name
      const { error: updateError } = await adminSupabase
        .from('members')
        .update({
          user_id: userId,
          status: 'PENDING', // still needs admin approval
          is_active: false,
          // name intentionally NOT updated — keep admin's name
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
      return NextResponse.json({ success: true, redirect: '/pending' })
    } else {
      // New member — get next member number using admin client
      const { data: maxRow } = await adminSupabase
        .from('members')
        .select('member_number')
        .eq('organization_id', orgId)
        .order('member_number', { ascending: false })
        .limit(1)
      const nextNumber = (maxRow && Array.isArray(maxRow) && maxRow.length > 0) ? (maxRow[0].member_number || 0) + 1 : 1
      console.log('New member inserted, nextNumber:', nextNumber);
      
      const { error: insertError } = await adminSupabase
        .from('members')
        .insert({
          organization_id: orgId,
          user_id: userId,
          name: name,
          phone: phone,
          role: 'MEMBER',
          status: 'PENDING',
          is_active: false,
          member_number: nextNumber,
          joining_date: new Date().toISOString().split('T')[0]
        })
      
      if (insertError) throw insertError
      return NextResponse.json({ success: true, redirect: '/pending' })
    }
  } catch (error: any) {
    console.error('Join API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
