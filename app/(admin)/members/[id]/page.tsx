import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { calcMemberStats } from "@/lib/calculations"
import MemberDetailClient from "./MemberDetailClient"
import type { Member } from "@/types"

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const { id } = await params
  const supabase = await createClient()

  const [{ data: member }, { data: contributions }, { data: loans }] = await Promise.all([
    supabase.from("members").select("*").eq("organization_id", performer.organization_id).eq("id", id).maybeSingle(),
    supabase.from("meeting_contributions").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("loans").select("*").eq("organization_id", performer.organization_id).eq("member_id", id).order("created_at", { ascending: false }),
  ])

  if (!member) redirect("/members")

  const stats = calcMemberStats(
    (contributions ?? []).map((c) => ({ savings_amount: c.savings_amount, interest_paid: c.interest_paid, is_present: c.is_present })),
    (loans ?? []).map((l) => ({ outstanding_amount: l.outstanding_amount, status: l.status }))
  )

  return (
    <MemberDetailClient 
      member={member as Member}
      stats={stats}
    />
  )
}
