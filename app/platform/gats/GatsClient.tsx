"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function GatsClient({ initialOrgs }: { initialOrgs: any[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')

  const filteredOrgs = initialOrgs.filter(o => {
    if (filter === 'PENDING') return !o.is_approved
    if (filter === 'APPROVED') return o.is_approved
    return true
  })

  const handleStatusChange = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this gat?`)) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/platform/gats/${id}/${action}`, { method: "POST" })
      if (!res.ok) throw new Error(`Failed to ${action} gat`)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Gats</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'ALL' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>All</button>
          <button onClick={() => setFilter('PENDING')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>Pending</button>
          <button onClick={() => setFilter('APPROVED')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'APPROVED' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>Approved</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Name / Code</th>
                <th className="px-6 py-3 font-medium text-gray-500">Location</th>
                <th className="px-6 py-3 font-medium text-gray-500">Members</th>
                <th className="px-6 py-3 font-medium text-gray-500">Plan</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{org.group_code}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-800">{org.district}</p>
                    <p className="text-xs text-gray-500">{org.taluka}, {org.village}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {org.members_count}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                      {org.subscription_plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {org.is_approved ? (
                      <span className="text-green-600 text-xs font-semibold px-2 py-1 bg-green-50 rounded-full">APPROVED</span>
                    ) : (
                      <span className="text-orange-600 text-xs font-semibold px-2 py-1 bg-orange-50 rounded-full">PENDING</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!org.is_approved ? (
                        <button 
                          disabled={loadingId === org.id}
                          onClick={() => handleStatusChange(org.id, 'approve')}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded text-xs font-semibold transition"
                        >
                          Approve
                        </button>
                      ) : (
                        <button 
                          disabled={loadingId === org.id}
                          onClick={() => handleStatusChange(org.id, 'reject')}
                          className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-xs font-semibold transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No Gats found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
