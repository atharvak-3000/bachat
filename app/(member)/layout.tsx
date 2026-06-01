import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import MemberLayoutClient from "@/components/shared/MemberLayoutClient"

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember()

  if (!member) redirect("/sign-in")
  if (member.role !== "MEMBER") redirect("/dashboard")

  return (
    <MemberLayoutClient>
      {children}
    </MemberLayoutClient>
  )
}
