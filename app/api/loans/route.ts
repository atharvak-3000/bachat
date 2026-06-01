import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAuth, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"

export async function GET(req: Request) {
  try {
    const performer = await requireAuth()
    const supabase = await createClient()

    const { data: loans, error } = await supabase
      .from("loans")
      .select("*, member:members!loans_member_id_fkey(*)")
      .eq("organization_id", performer.organization_id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(loans || [])
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAuth()
    const supabase = await createClient()
    const body = await req.json()

    let { member_id, amount, interest_rate, purpose, term_months } = body // amount in paise

    // Tenant and Role checks
    let requestMemberId = member_id
    if (performer.role === 'MEMBER') {
      // Members can only request for themselves
      requestMemberId = performer.id
    }

    if (!requestMemberId || !amount || amount <= 0 || !term_months) {
      return NextResponse.json({ error: 'Member, amount, and term months are required' }, { status: 400 })
    }

    // Verify member exists and is ACTIVE in the same org
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, status, is_active, organization_id")
      .eq("id", requestMemberId)
      .maybeSingle()

    if (memberError) throw memberError
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Tenant check using string comparison
    if (!member.organization_id || !performer.organization_id ||
        member.organization_id !== performer.organization_id) {
      return NextResponse.json({ error: 'Member not in your organization' }, { status: 403 })
    }

    // Treat null status/is_active as active
    const isActive = member.is_active !== false &&
      (!member.status || member.status === 'ACTIVE')

    if (!isActive) {
      return NextResponse.json({ error: 'Member is not active or does not exist' }, { status: 400 })
    }

    // No existing ACTIVE loan for member
    const { data: activeLoan, error: activeLoanError } = await supabase
      .from("loans")
      .select("id")
      .eq("member_id", requestMemberId)
      .eq("status", "ACTIVE")
      .maybeSingle()

    if (activeLoanError) throw activeLoanError
    if (activeLoan) {
      return NextResponse.json({ error: 'Member already has an active loan' }, { status: 400 })
    }

    // Amount <= max_loan_limit if set
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("max_loan_limit")
      .eq("id", performer.organization_id)
      .single()

    if (orgError) throw orgError
    if (org && org.max_loan_limit && amount > org.max_loan_limit) {
      return NextResponse.json({ error: `Amount exceeds organization maximum limit of ₹${org.max_loan_limit / 100}` }, { status: 400 })
    }

    // status = performer.role === 'SUPERADMIN' ? 'ACTIVE' : 'PENDING'
    const status = performer.role === 'SUPERADMIN' ? 'ACTIVE' : 'PENDING'

    const { data: loan, error: insertError } = await supabase
      .from("loans")
      .insert({
        organization_id: performer.organization_id,
        member_id: requestMemberId,
        loan_amount: amount,
        outstanding_amount: status === 'ACTIVE' ? amount : 0,
        interest_rate: interest_rate || 2.0,
        disbursed_date: new Date().toISOString().split('T')[0],
        purpose: purpose || '',
        term_months: term_months,
        status,
        requested_by: performer.id,
        approved_by: status === 'ACTIVE' ? performer.id : null,
        approved_at: status === 'ACTIVE' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (insertError) throw insertError

    if (status === 'ACTIVE') {
      const emis = calcEmiSchedule(
        amount,
        interest_rate || 2.0,
        term_months,
        new Date()
      )

      const emiInserts = emis.map(e => ({
        ...e,
        loan_id: loan.id
      }))

      const { error: emiInsertError } = await supabase
        .from("loan_emis")
        .insert(emiInserts)

      if (emiInsertError) throw emiInsertError
    } else {
      // Notify SuperAdmins of the pending request
      const { data: superadmins } = await supabase
        .from("members")
        .select("id")
        .eq("organization_id", performer.organization_id)
        .eq("role", "SUPERADMIN")

      if (superadmins && superadmins.length > 0) {
        const notifications = superadmins.map(admin => ({
          member_id: admin.id,
          organization_id: performer.organization_id,
          title: 'New Loan Request Awaiting Approval',
          message: `${member.name} has requested a loan of ₹${amount / 100}. Please review.`,
          type: 'EMI_DUE',
          is_read: false
        }))
        await supabase.from("notifications").insert(notifications)
      }
    }

    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_REQUESTED', 'loan', loan.id, {
      member_id: requestMemberId,
      amount,
      status
    })

    return NextResponse.json(loan)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
