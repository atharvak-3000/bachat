"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

type Member = any // Type properly in real app

export default function RecentMembersTable({ 
  members, 
  currentMemberRole, 
  currentMemberId, 
  groupCode 
}: { 
  members: Member[]
  currentMemberRole: string
  currentMemberId: string
  groupCode: string 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join?code=${groupCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!confirm(newRole === 'SUPERADMIN' ? 'Make Admin?' : 'Remove Admin?')) return
    try {
      const res = await fetch(`/api/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        toast.success('Role updated. Refreshing...')
        window.location.reload()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update role')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'SUPERADMIN') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">SuperAdmin</span>
    if (role === 'SUPERADMIN') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Admin</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Member</span>
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'ACTIVE' || !status) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
    if (status === 'PENDING') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
    if (status === 'REJECTED') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>
    return null
  }

  return (
    <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-[#1B2B6B]">अलीकडे जोडलेले सदस्य</h2>
          <button onClick={handleCopyLink} className="text-xs px-3 py-1 rounded border border-[#2E4099] text-[#2E4099] hover:bg-[#2E4099]/10 transition font-semibold">
            {copied ? '✓ Copied' : '🔗 Copy Invite Link'}
          </button>
        </div>
        <Link href="/members" className="text-xs text-[#E85D26] hover:underline font-bold">सर्व पाहा →</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50 text-xs text-[#1B2B6B]/80 font-bold uppercase tracking-wider">
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">नाव</th>
              <th className="px-6 py-3 text-left">भूमिका</th>
              <th className="px-6 py-3 text-left">स्टेटस</th>
              <th className="px-6 py-3 text-left">फोन</th>
              <th className="px-6 py-3 text-right">कृती</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-[#2E4099]/5 transition">
                <td className="px-6 py-3 text-gray-400 font-mono text-xs">{m.member_number}</td>
                <td className="px-6 py-3 font-semibold text-gray-800">{m.name}</td>
                <td className="px-6 py-3">{getRoleBadge(m.role)}</td>
                <td className="px-6 py-3">{getStatusBadge(m.status)}</td>
                <td className="px-6 py-3 text-gray-500">{m.phone}</td>
                <td className="px-6 py-3 text-right">
                  {currentMemberRole === 'SUPERADMIN' && m.id !== currentMemberId && m.role !== 'SUPERADMIN' && (
                    <div className="flex justify-end gap-2">
                      {m.role === 'MEMBER' && (
                        <button onClick={() => handleRoleChange(m.id, 'SUPERADMIN')} className="px-2 py-1 rounded text-xs font-semibold border border-[#2E4099] text-[#2E4099] hover:bg-[#2E4099]/10">
                          Make Admin
                        </button>
                      )}
                      {m.role === 'SUPERADMIN' && (
                        <button onClick={() => handleRoleChange(m.id, 'MEMBER')} className="px-2 py-1 rounded text-xs font-semibold border border-[#E85D26] text-[#E85D26] hover:bg-[#E85D26]/10">
                          Remove Admin
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm font-medium">
                  अद्याप कोणताही सदस्य नाही. <Link href="/members" className="text-[#E85D26] hover:underline font-bold">सदस्य जोडा →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
