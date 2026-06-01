"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import AddMemberForm from "@/components/members/AddMemberForm"
import type { Member, Organization } from "@/types"

type MemberWithOrg = Member & { organization: Organization }

const roleBadge: Record<string, { label: string; className: string }> = {
  SUPERADMIN: { label: "महाअध्यक्ष", className: "bg-purple-100 text-purple-700 border border-purple-200" },
  MEMBER:     { label: "सदस्य", className: "bg-gray-100 text-gray-600 border border-gray-200" },
}

interface Props {
  members: Member[]
  currentMember: MemberWithOrg
  inviteLink: string
}

export default function MembersClient({ members, currentMember, inviteLink }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success("Invite link copied!")
  }

  const changeRole = async (memberId: string, newRole: 'SUPERADMIN' | 'MEMBER') => {
    setLoadingId(memberId)
    try {
      const res = await fetch(`/api/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`भूमिका ${newRole === 'SUPERADMIN' ? 'Admin' : 'Member'} ला बदलली!`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "भूमिका बदलणे अयशस्वी")
    } finally {
      setLoadingId(null)
    }
  }

  const deactivateMember = async (memberId: string, name: string) => {
    if (!confirm(`${name} ला निष्क्रिय करायचे?`)) return
    setLoadingId(memberId)
    try {
      const res = await fetch(`/api/members/${memberId}/remove`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${name} निष्क्रिय केले`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "निष्क्रिय करणे अयशस्वी")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B6B]">👥 सदस्य</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="inline-flex items-center gap-1 bg-[#E85D26]/10 text-[#E85D26] text-xs font-semibold px-2 py-0.5 rounded-full">
              {members.length} सक्रिय सदस्य
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={copyInviteLink}
            className="flex items-center gap-2 px-4 py-2 border border-[#2E4099] rounded-lg text-sm text-[#2E4099] hover:bg-[#2E4099]/10 transition font-semibold">
            🔗 Invite Link Copy करा
          </button>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E85D26] hover:bg-[#D04E1A] text-white rounded-lg text-sm font-semibold transition shadow-sm">
            + नवीन सदस्य जोडा
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-[#1B2B6B]/80 font-bold uppercase tracking-wider">
              <th className="px-6 py-4 text-left">#</th>
              <th className="px-6 py-4 text-left">नाव</th>
              <th className="px-6 py-4 text-left">फोन</th>
              <th className="px-6 py-4 text-left">भूमिका</th>
              <th className="px-6 py-4 text-left">KYC</th>
              <th className="px-6 py-4 text-left">सामील तारीख</th>
              <th className="px-6 py-4 text-left">क्रिया</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((m) => {
              const badge = roleBadge[m.role] ?? roleBadge.MEMBER
              const isSelf = m.id === currentMember.id
              const isLoading = loadingId === m.id
              return (
                <tr key={m.id} className="hover:bg-[#2E4099]/5 transition">
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{m.member_number}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{m.name}</p>
                      {m.name_marathi && <p className="text-xs text-gray-400">{m.name_marathi}</p>}
                      {isSelf && <span className="text-xs text-[#E85D26] font-medium">तुम्ही</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{m.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (m.kyc_status as string) === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                      (m.kyc_status as string) === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      (m.kyc_status as string) === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{m.kyc_status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(m.joining_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* SuperAdmin-only actions */}
                      {currentMember.role === 'SUPERADMIN' && !isSelf && (
                        <>
                          {m.role === 'MEMBER' && (
                            <button
                                onClick={() => changeRole(m.id, 'SUPERADMIN')}
                                disabled={isLoading}
                                className="text-xs border border-[#2E4099] text-[#2E4099] hover:bg-[#2E4099]/10 px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap disabled:opacity-50">
                                {isLoading ? '...' : 'अध्यक्ष बनवा'}
                              </button>
                            )}
                            {m.role === 'SUPERADMIN' && (
                              <button
                                onClick={() => changeRole(m.id, 'MEMBER')}
                                disabled={isLoading}
                                className="text-xs border border-amber-500 text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap disabled:opacity-50">
                                {isLoading ? '...' : 'अध्यक्ष काढा'}
                              </button>
                            )}
                            <button
                              onClick={() => deactivateMember(m.id, m.name)}
                              disabled={isLoading}
                              className="text-xs border border-red-500 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap disabled:opacity-50">
                              निष्क्रिय
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    अद्याप कोणताही सदस्य नाही
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  
        <AddMemberForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} />
      </div>
  )
}
