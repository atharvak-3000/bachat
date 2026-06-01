import { getAuthForApi, forbidden, unauthorized, logActivity } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate requester
    const { member, supabase } = await getAuthForApi()
    if (!member) {
      return unauthorized()
    }

    // 2. Authorize requester role (must be SUPERADMIN or ADMIN)
    const allowedRoles = ["SUPERADMIN", "ADMIN"]
    if (!allowedRoles.includes(member.role)) {
      return forbidden()
    }

    // 3. Parse and validate request body
    const { memberId, newPassword } = await request.json()
    if (!memberId || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // 4. Fetch target member details
    const { data: targetMember, error: fetchError } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle()

    if (fetchError || !targetMember) {
      console.error("[Reset Password API] Error fetching target member:", fetchError)
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // 5. Enforce Organization Boundaries (Same org verification)
    if (targetMember.organization_id !== member.organization_id) {
      console.warn(`[Reset Password API] Security Violation: User ${member.id} tried to reset password for member ${memberId} in different org.`)
      return forbidden()
    }

    // 6. Enforce Role-Based Access Control Rules
    // ADMIN can only reset MEMBER passwords. They CANNOT reset other ADMINs or SUPERADMINs.
    const targetRole = targetMember.role as string
    const requesterRole = member.role as string

    if (requesterRole === "ADMIN" && targetRole !== "MEMBER") {
      console.warn(`[Reset Password API] Security Violation: ADMIN ${member.id} tried to reset password for non-MEMBER target ${memberId} (${targetRole}).`)
      return NextResponse.json({ error: "ADMINs can only reset passwords for standard MEMBERs." }, { status: 403 })
    }

    // 7. Execute reset password via Supabase Admin Client (Service Role Auth bypasses client limitations)
    const adminClient = createAdminClient()
    const { error: resetError } = await adminClient.auth.admin.updateUserById(
      targetMember.user_id,
      { password: newPassword }
    )

    if (resetError) {
      console.error("[Reset Password API] Supabase Admin update failure:", resetError.message)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    // 8. Log the security action in the activity_logs database table
    await logActivity(
      supabase,
      member.id,
      member.organization_id,
      "RESET_MEMBER_PASSWORD",
      "member",
      targetMember.id,
      {
        reset_by_role: member.role,
        member_name: targetMember.name,
      }
    )

    console.log(`[Reset Password API] Successful password reset for target ${targetMember.name} (ID: ${memberId}) performed by ${member.role} ${member.name}`)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error("[Reset Password API] Fatal exception caught:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
