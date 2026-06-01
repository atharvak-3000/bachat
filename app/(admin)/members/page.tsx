"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import AddMemberForm from "@/components/members/AddMemberForm"

type Member = any // Will map to proper type in real app

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED'>('ACTIVE')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMemberCreds, setNewMemberCreds] = useState<{name: string, phone: string, password: string} | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const [lang, setLang] = useState<'mr'|'en'>('mr')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang((localStorage.getItem('bb_lang') as 'mr'|'en') || 'mr')
    }
    const handler = (e: Event) => {
      setLang((e as CustomEvent).detail)
    }
    window.addEventListener('bb-lang-change', handler)
    return () => window.removeEventListener('bb-lang-change', handler)
  }, [])

  const T = {
    mr: {
      title: "सदस्य",
      copyLink: "🔗 लिंक कॉपी करा",
      copied: "✓ कॉपी झाली!",
      addMember: "+ सदस्य जोडा",
      shareNote: "सदस्यांशी ही लिंक शेअर करा. ते प्रवेश मिळवण्यासाठी येथे स्वाक्षरी करतात.",
      tabAll: "सर्व",
      tabActive: "सक्रिय",
      tabPending: "प्रलंबित",
      tabRejected: "नाकारलेले",
      view: "पहा",
      makeAdmin: "अध्यक्ष बनवा",
      removeAdmin: "अध्यक्ष काढा",
      reject: "काढा",
      noMembers: "कोणतेही सदस्य आढळले नाहीत.",
      tableNum: "#",
      tableName: "नाव",
      tablePhone: "फोन",
      tableRole: "भूमिका",
      tableStatus: "स्थिती",
      tableJoined: "सामील झाले",
      tableActions: "कृती",
      addTitle: "नवीन सदस्य जोडा",
      addNote: "टीप: येथे जोडलेले सदस्य स्वयं-मंजूर आहेत.",
      fullName: "पूर्ण नाव *",
      nameMarathi: "नाव (मराठी)",
      phoneLabel: "फोन * (10 आकडे)",
      passwordLabel: "पासवर्ड *",
      passwordHint: "📋 हा फोन नंबर आणि पासवर्ड सदस्यासोबत शेअर करा जेणेकरून ते लॉग इन करू शकतील. ते थेट साइन-इन पृष्ठ वापरू शकतात — कोणतीही आमंत्रण लिंक आवश्यक नाही.",
      addressLabel: "पत्ता",
      joiningDateLabel: "सामील होण्याची तारीख",
      cancel: "रद्द करा",
      adding: "जोडत आहे...",
      done: "झाले",
      addedSuccessTitle: "सदस्य जोडला गेला!",
      addedSuccessSub: "लॉग इन करण्यासाठी कृपया हे तपशील सदस्यासोबत शेअर करा.",
      badgeSuperadmin: "महाअध्यक्ष",
      badgeAdmin: "Admin",
      badgeMember: "Member",
      statusActive: "Active",
      statusPending: "Pending",
      statusRejected: "Rejected",
      loading: "सदस्य लोड होत आहेत...",
      roleConfirm: "भूमिका बदलायची आहे का?",
      approvedSuccess: "सदस्य मंजूर झाला",
      rejectReasonPrompt: "नाव नाकारण्याचे कारण काय?",
      rejectSuccess: "सदस्य नाकारला",
      addFail: "सदस्य जोडण्यात अपयश आले",
      credsCopied: "तपशील कॉपी केले!",
    },
    en: {
      title: "Members",
      copyLink: "🔗 Copy Link",
      copied: "✓ Copied!",
      addMember: "+ Add Member",
      shareNote: "Share this link with members. They sign up here to get access.",
      tabAll: "All",
      tabActive: "Active",
      tabPending: "Pending",
      tabRejected: "Rejected",
      view: "View",
      makeAdmin: "Make Admin",
      removeAdmin: "Remove Admin",
      reject: "Reject",
      noMembers: "No members found.",
      tableNum: "#",
      tableName: "Name",
      tablePhone: "Phone",
      tableRole: "Role",
      tableStatus: "Status",
      tableJoined: "Joined",
      tableActions: "Actions",
      addTitle: "Add New Member",
      addNote: "Note: Members added here are auto-approved.",
      fullName: "Full Name *",
      nameMarathi: "Name (Marathi)",
      phoneLabel: "Phone * (10 digits)",
      passwordLabel: "Password *",
      passwordHint: "📋 Share this phone number and password with the member so they can log in. They can use the sign-in page directly — no invite link needed.",
      addressLabel: "Address",
      joiningDateLabel: "Joining Date",
      cancel: "Cancel",
      adding: "Adding...",
      done: "Done",
      addedSuccessTitle: "Member Added!",
      addedSuccessSub: "Please share these credentials with the member so they can log in.",
      badgeSuperadmin: "SuperAdmin",
      badgeAdmin: "Admin",
      badgeMember: "Member",
      statusActive: "Active",
      statusPending: "Pending",
      statusRejected: "Rejected",
      loading: "Loading members...",
      roleConfirm: "Are you sure you want to change the role?",
      approvedSuccess: "Member approved",
      rejectReasonPrompt: "Reason for rejecting?",
      rejectSuccess: "Member rejected",
      addFail: "Failed to add member",
      credsCopied: "Credentials copied!",
    }
  }
  const t = T[lang]
  


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [membersRes, meRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/members/me')
      ])
      
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(Array.isArray(data) ? data : (data.members || []))
      }
      
      if (meRes.ok) {
        const data = await meRes.json()
        setCurrentMember(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!currentMember?.organization?.group_code) return
    const link = `${window.location.origin}/join?code=${currentMember.organization.group_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!confirm(t.roleConfirm)) return
    try {
      const res = await fetch(`/api/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.roleChanged) {
          toast.success('Role updated. Member needs to sign in again to access new permissions.')
        } else {
          toast.success('Role updated')
        }
        fetchData()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to update role')
      }
    } catch (e: any) {
      toast.error('An error occurred')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        toast.success(t.approvedSuccess)
        fetchData()
      } else {
        toast.error('Failed to approve')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`${t.rejectReasonPrompt} ${name}?`)
    if (reason === null) return
    try {
      const res = await fetch(`/api/members/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        toast.success(t.rejectSuccess)
        fetchData()
      } else {
        toast.error('Failed to reject')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }



  const getRoleBadge = (role: string) => {
    if (role === 'SUPERADMIN') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">{t.badgeSuperadmin}</span>
    if (role === 'ADMIN') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">{t.badgeAdmin}</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400">{t.badgeMember}</span>
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'ACTIVE' || !status) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">{t.statusActive}</span>
    if (status === 'PENDING') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{t.statusPending}</span>
    if (status === 'REJECTED') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">{t.statusRejected}</span>
    return null
  }

  const counts = {
    all: members.length,
    active: members.filter(m => m.status === 'ACTIVE' || !m.status).length,
    pending: members.filter(m => m.status === 'PENDING').length,
    rejected: members.filter(m => m.status === 'REJECTED').length
  }

  const filteredMembers = members.filter(m => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'ACTIVE') return m.status === 'ACTIVE' || !m.status
    return m.status === activeTab
  })

  const isSuperAdmin = currentMember?.role === 'SUPERADMIN'
  const isAdmin = currentMember?.role === 'ADMIN'

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.loading}</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {t.title} <span className="text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full">{counts.all}</span>
        </h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${
              copied ? 'border-green-300 text-green-600 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {copied ? t.copied : t.copyLink}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {t.addMember}
          </button>
        </div>
      </div>

      {/* Invite Bar */}
      {currentMember?.organization?.group_code && (
        <div className="flex flex-col gap-2 p-3 bg-orange-50 dark:bg-orange-950/10 rounded-lg border border-orange-200 dark:border-orange-500/20 mb-6">
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm font-mono text-orange-900 dark:text-orange-300 truncate">
              {window.location.origin}/join?code={currentMember.organization.group_code}
            </p>
            <button 
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-850 dark:text-orange-400 dark:hover:bg-orange-950/40 transition whitespace-nowrap bg-white dark:bg-gray-950"
            >
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
          <p className="text-xs text-orange-800 dark:text-orange-400">
            {t.shareNote}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-gray-800 mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {([
          { id: 'ALL', label: t.tabAll, count: counts.all },
          { id: 'ACTIVE', label: t.tabActive, count: counts.active },
          { id: 'PENDING', label: t.tabPending, count: counts.pending },
          { id: 'REJECTED', label: t.tabRejected, count: counts.rejected }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id 
                ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3 mb-6">
        {filteredMembers.map(m => {
          const isSelf = m.id === currentMember?.id
          const targetIsSuperAdmin = m.role === 'SUPERADMIN'
          const targetIsActive = !m.status || m.status === 'ACTIVE'
          const isSuperAdmin = currentMember?.role === 'SUPERADMIN'
          const isAdminRole = currentMember?.role === 'ADMIN'

          return (
            <div key={m.id}
                 className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
              
              {/* Row 1: Number + Name + Role */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6">
                    #{m.member_number}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {m.name}
                  </span>
                </div>
                {getRoleBadge(m.role)}
              </div>

              {/* Row 2: Phone + Status + Joined */}
              <div className="flex items-center justify-between mb-3 ml-8">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{m.phone || '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {m.joining_date
                      ? new Date(m.joining_date).toLocaleDateString('en-IN')
                      : '—'}
                  </p>
                </div>
                {getStatusBadge(m.status)}
              </div>

              {/* Row 3: Actions */}
              <div className="flex flex-wrap gap-2 ml-8 pt-2 
                              border-t border-gray-100 dark:border-gray-800">
                <Link href={`/members/${m.id}`}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all">
                  {t.view}
                </Link>

                {isSuperAdmin && !isSelf && 
                 m.role === 'MEMBER' && targetIsActive && (
                  <button
                    onClick={() => handleRoleChange(m.id, 'ADMIN')}
                    className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-medium whitespace-nowrap hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                    {t.makeAdmin}
                  </button>
                )}

                {isSuperAdmin && !isSelf && m.role === 'ADMIN' && (
                  <button
                    onClick={() => handleRoleChange(m.id, 'MEMBER')}
                    className="px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-medium whitespace-nowrap hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all">
                    {t.removeAdmin}
                  </button>
                )}

                {/* Reject — for ACTIVE members */}
                {!isSelf && !targetIsSuperAdmin &&
                 (isSuperAdmin || (isAdminRole && m.role === 'MEMBER')) &&
                 (m.status === 'ACTIVE' || !m.status) && (
                  <button
                    onClick={() => handleReject(m.id, m.name)}
                    className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                    {t.reject}
                  </button>
                )}

                {isSuperAdmin && m.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleApprove(m.id)}
                      className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium whitespace-nowrap hover:bg-green-700 transition-all">
                      Approve
                    </button>
                    <button onClick={() => handleReject(m.id, m.name)}
                      className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                      {t.reject}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            {t.noMembers}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-950 border-b dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tableNum}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tableName}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tablePhone}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tableRole}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tableStatus}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t.tableJoined}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredMembers.map(m => {
              const target = m
              const isSelf = target.id === currentMember?.id
              const targetIsSuperAdmin = target.role === 'SUPERADMIN'
              const targetIsActive = !target.status || target.status === 'ACTIVE'
              const isAdminRole = currentMember?.role === 'ADMIN'

              return (
                <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{target.member_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{target.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{target.phone}</td>
                  <td className="px-4 py-3">{getRoleBadge(target.role)}</td>
                  <td className="px-4 py-3">{getStatusBadge(target.status)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {target.joining_date ? new Date(target.joining_date).toLocaleDateString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 flex-wrap items-center">
                      <Link href={`/members/${target.id}`}
                            className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all">
                        {t.view}
                      </Link>
                      
                      {currentMember?.role === 'SUPERADMIN' && 
                       target.role === 'MEMBER' && !isSelf && targetIsActive && (
                        <button onClick={() => handleRoleChange(target.id, 'ADMIN')}
                                className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-medium whitespace-nowrap hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                          {t.makeAdmin}
                        </button>
                      )}
                      
                      {currentMember?.role === 'SUPERADMIN' && 
                       target.role === 'ADMIN' && !isSelf && (
                        <button onClick={() => handleRoleChange(target.id, 'MEMBER')}
                                className="px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-medium whitespace-nowrap hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all">
                          {t.removeAdmin}
                        </button>
                      )}
                      
                      {/* Reject — for ACTIVE members */}
                      {!isSelf && !targetIsSuperAdmin &&
                       (isSuperAdmin || (isAdminRole && target.role === 'MEMBER')) &&
                       (target.status === 'ACTIVE' || !target.status) && (
                        <button
                          onClick={() => handleReject(target.id, target.name)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                          {t.reject}
                        </button>
                      )}
                      
                      {isSuperAdmin && 
                       target.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(target.id)}
                                  className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium whitespace-nowrap hover:bg-green-700 transition-all">
                            Approve
                          </button>
                          <button onClick={() => handleReject(target.id, target.name)}
                                  className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                            {t.reject}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t.noMembers}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddMemberForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={(creds) => {
          setNewMemberCreds(creds)
          fetchData()
        }}
      />

      {/* Success Credentials Modal */}
      {newMemberCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-[#1A1D27] dark:border dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.addedSuccessTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t.addedSuccessSub}
            </p>

            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6 text-left space-y-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Login Phone:</span>
                <p className="font-mono text-gray-900 dark:text-white font-bold">{newMemberCreds.phone}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Password:</span>
                <p className="font-mono text-gray-900 dark:text-white font-bold">{newMemberCreds.password}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Hi ${newMemberCreds.name},\nYour BachatGatOnline login details are:\nPhone: ${newMemberCreds.phone}\nPassword: ${newMemberCreds.password}\nLogin at: ${window.location.origin}/sign-in`);
                  toast.success(t.credsCopied);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition"
              >
                Copy Details
              </button>
              <button
                onClick={() => setNewMemberCreds(null)}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                {t.done}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
