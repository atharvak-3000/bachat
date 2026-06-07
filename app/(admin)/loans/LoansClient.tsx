"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatRupees } from "@/lib/calculations"
import Link from "next/link"
import type { Loan, Member, Role } from "@/types"

interface LoanWithDetails extends Loan {
  member: Member
  overdue_count: number
}

export default function LoansClient({
  loans,
  currentRole,
  activeTab: initialTab
}: {
  loans: LoanWithDetails[]
  currentRole: Role
  activeTab: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState(initialTab)
  const [loadingId, setLoadingId] = useState<string | null>(null)

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
      title: "कर्ज व्यवस्थापन",
      sub: "मागणी केलेल्या कर्जांना मंजुरी द्या, थकीत शिल्लक ट्रॅक करा, मासिक EMI पहा आणि कर्ज वसुलीचे नियोजन करा.",
      activeLoans: "सक्रिय कर्ज",
      pendingApprovals: "मंजुरी प्रलंबित",
      overdueAccounts: "थकीत खाती",
      totalOutstanding: "एकूण येणे कर्ज",
      tabAll: "सर्व",
      tabPending: "प्रलंबित",
      tabActive: "सक्रिय",
      tabOverdue: "थकीत",
      tabClosed: "बंद झालेले",
      memberLabel: "सदस्य",
      loanAmountLabel: "कर्ज रक्कम",
      purposeLabel: "हेतू",
      rateLabel: "व्याज दर (% वार्षिक)",
      outstandingLabel: "येणे शिल्लक",
      disbursedDateLabel: "वितरण तारीख",
      statusLabel: "स्थिती",
      actionsLabel: "कृती",
      noLoansText: "या श्रेणीमध्ये कोणतेही कर्ज आढळले नाही.",
      approveBtn: "मंजूर करा",
      rejectBtn: "नाकारा",
      closeBtn: "कर्ज बंद करा",
      viewEmisBtn: "EMI पहा",
      viewBtn: "पहा",
      pendingStatus: "Pending",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      overdueEmiWarning: "EMI थकीत",
      approveConfirm: "आपण नक्की हे कर्ज मंजूर करू इच्छिता? यामुळे कर्ज वितरित होईल आणि EMI वेळापत्रक तयार होईल.",
      rejectConfirmPrompt: "कर्ज नाकारण्याचे कारण प्रविष्ट करा (ऐच्छिक):",
      rejectReasonDefault: "SuperAdmin द्वारे नाकारले",
      closeConfirm: "आपण नक्की हे कर्ज बंद करू इच्छिता? यामुळे थकीत शिल्लक 0 होईल आणि सर्व EMI भरलेले दाखवले जातील.",
      noPurpose: "तपशील नाही",
      awaitingSuperAdminHint: "अध्यक्ष मंजूर (प्रलंबित)",
    },
    en: {
      title: "Loans Management",
      sub: "Approve requested loans, track outstanding balances, view monthly EMIs, and manage recoveries.",
      activeLoans: "Active Loans",
      pendingApprovals: "Pending Approvals",
      overdueAccounts: "Overdue Accounts",
      totalOutstanding: "Total Outstanding",
      tabAll: "All",
      tabPending: "Pending",
      tabActive: "Active",
      tabOverdue: "Overdue",
      tabClosed: "Closed",
      memberLabel: "Member",
      loanAmountLabel: "Loan Amount",
      purposeLabel: "Purpose",
      rateLabel: "Rate (% p.a.)",
      outstandingLabel: "Outstanding",
      disbursedDateLabel: "Disbursed Date",
      statusLabel: "Status",
      actionsLabel: "Actions",
      noLoansText: "No loans found in this category.",
      approveBtn: "Approve",
      rejectBtn: "Reject",
      closeBtn: "Close Loan",
      viewEmisBtn: "View EMIs",
      viewBtn: "View",
      pendingStatus: "Pending",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      overdueEmiWarning: "EMI(s) overdue",
      approveConfirm: "Are you sure you want to approve this loan? This will disburse the loan and generate the EMI schedule.",
      rejectConfirmPrompt: "Please enter the reason for rejection (optional):",
      rejectReasonDefault: "Rejected by SuperAdmin",
      closeConfirm: "Are you sure you want to manually CLOSE this loan? This will set outstanding balance to 0 and mark all EMIs as paid.",
      noPurpose: "No purpose",
      awaitingSuperAdminHint: "View (Pending)",
    }
  }
  const t = T[lang]

  function LoanStatusBadge({ status }: { status: string }) {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">{t.pendingStatus}</span>
      case 'ACTIVE':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">{t.activeStatus}</span>
      case 'CLOSED':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30">{t.closedStatus}</span>
      default:
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">{t.rejectedStatus}</span>
    }
  }

  const isSuperAdmin = currentRole === 'SUPERADMIN'

  // Calculations for Stats
  const activeLoans = loans.filter(l => l.status === 'ACTIVE')
  const pendingLoans = loans.filter(l => l.status === 'PENDING')
  const closedLoans = loans.filter(l => l.status === 'CLOSED' || l.status === 'REJECTED')
  const overdueLoans = loans.filter(l => l.status === 'ACTIVE' && l.overdue_count > 0)

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding_amount, 0)

  // Filter based on selected tab
  const getFilteredLoans = () => {
    switch (tab) {
      case "pending": return pendingLoans
      case "active": return activeLoans
      case "overdue": return overdueLoans
      case "closed": return closedLoans
      default: return loans
    }
  }

  const filteredLoans = getFilteredLoans()

  // Actions
  const handleApprove = async (loanId: string) => {
    if (!confirm(t.approveConfirm)) return
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/approve`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to approve loan")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (loanId: string) => {
    const reason = prompt(t.rejectConfirmPrompt)
    if (reason === null) return // User cancelled
    
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || t.rejectReasonDefault })
      })
      if (!res.ok) throw new Error("Failed to reject loan")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleClose = async (loanId: string) => {
    if (!confirm(t.closeConfirm)) return
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/close`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to close loan")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B2B6B] dark:text-white">
          {t.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {t.sub}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.activeLoans}</span>
          <h4 className="text-lg md:text-2xl font-black text-[#2E4099] dark:text-blue-400 mt-1.5 md:mt-2">{activeLoans.length}</h4>
        </div>
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.pendingApprovals}</span>
          <h4 className="text-lg md:text-2xl font-black text-[#E85D26] dark:text-orange-400 mt-1.5 md:mt-2">{pendingLoans.length}</h4>
        </div>
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.overdueAccounts}</span>
          <h4 className="text-lg md:text-2xl font-black text-red-600 dark:text-red-400 mt-1.5 md:mt-2">{overdueLoans.length}</h4>
        </div>
        <div className="bg-[#1B2B6B] border border-[#1B2B6B] dark:bg-[#0D1021] dark:border-blue-900/30 p-4 md:p-6 rounded-3xl shadow-md text-white">
          <span className="text-[10px] md:text-xs font-bold text-white/70 dark:text-white/60 uppercase tracking-wider leading-tight block">{t.totalOutstanding}</span>
          <h4 className="text-lg md:text-2xl font-black text-white mt-1.5 md:mt-2 break-all">{formatRupees(totalOutstanding)}</h4>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 text-sm font-semibold overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {[
          { id: "all", label: `${t.tabAll} (${loans.length})` },
          { id: "pending", label: `${t.tabPending} (${pendingLoans.length})` },
          { id: "active", label: `${t.tabActive} (${activeLoans.length})` },
          { id: "overdue", label: `${t.tabOverdue} (${overdueLoans.length})` },
          { id: "closed", label: `${t.tabClosed} (${closedLoans.length})` }
        ].map(tInfo => (
          <button
            key={tInfo.id}
            onClick={() => setTab(tInfo.id)}
            className={`pb-3 relative transition-colors whitespace-nowrap flex-shrink-0 ${tab === tInfo.id ? "text-[#E85D26]" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            {tInfo.label}
            {tab === tInfo.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-gray-400 dark:text-gray-500 font-medium italic text-sm">{t.noLoansText}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          {/* MOBILE LOAN CARDS */}
          <div className="md:hidden space-y-3 p-4 bg-gray-50/50 dark:bg-gray-950/20">
            {filteredLoans.map(loan => (
              <div key={loan.id}
                   className={`bg-white dark:bg-[#1A1D27] rounded-2xl border p-4 shadow-sm ${
                     loan.overdue_count > 0
                       ? 'border-red-200 bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/10'
                       : 'border-gray-200 dark:border-gray-800'
                   }`}>

                {/* Member + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {loan.member?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {loan.purpose || t.noPurpose}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>

                {/* Amount grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.loanAmountLabel}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatRupees(loan.loan_amount)}
                    </p>
                  </div>
                  <div className="bg-[#E85D26]/10 dark:bg-[#E85D26]/5 rounded-xl p-2.5">
                    <p className="text-xs text-[#E85D26] dark:text-orange-400 font-semibold">{t.outstandingLabel}</p>
                    <p className="text-sm font-bold text-[#E85D26] dark:text-orange-400">
                      {formatRupees(loan.outstanding_amount)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.rateLabel.split(' ')[0]}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {loan.interest_rate}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.disbursedDateLabel}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString('en-IN') : '—'}
                    </p>
                  </div>
                </div>

                {/* Overdue warning */}
                {loan.overdue_count > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-2 animate-pulse">
                    ⚠️ {loan.overdue_count} {t.overdueEmiWarning}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Link href={`/loans/${loan.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold
                               border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 bg-white dark:bg-gray-950">
                    {t.viewEmisBtn}
                  </Link>
                  {loan.status === 'PENDING' && 
                   currentRole === 'SUPERADMIN' && (
                    <>
                      <button
                        onClick={() => handleApprove(loan.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-green-600 text-white hover:bg-green-700">
                        {t.approveBtn}
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                   border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
                        {t.rejectBtn}
                      </button>
                    </>
                  )}
                  {loan.status === 'ACTIVE' && 
                   currentRole === 'SUPERADMIN' && (
                    <button
                      onClick={() => handleClose(loan.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                 border border-red-500 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition">
                      {t.closeBtn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold text-xs border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider">
                  <th className="px-6 py-4">{t.memberLabel}</th>
                  <th className="px-6 py-4">{t.loanAmountLabel}</th>
                  <th className="px-6 py-4">{t.purposeLabel}</th>
                  <th className="px-6 py-4 text-center">{t.rateLabel}</th>
                  <th className="px-6 py-4">{t.outstandingLabel}</th>
                  <th className="px-6 py-4">{t.disbursedDateLabel}</th>
                  <th className="px-6 py-4">{t.statusLabel}</th>
                  <th className="px-6 py-4 text-right">{t.actionsLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium">
                {filteredLoans.map(l => {
                  const isOverdue = l.status === 'ACTIVE' && l.overdue_count > 0
                  const rowBg = isOverdue 
                    ? "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 dark:hover:bg-red-950/20" 
                    : "hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10"
                  
                  return (
                    <tr key={l.id} className={`${rowBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{l.member?.name}</div>
                        {isOverdue && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-full mt-1 inline-block animate-pulse">
                            ⚠️ {l.overdue_count} {t.overdueEmiWarning.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{formatRupees(l.loan_amount)}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs truncate max-w-[150px]" title={l.purpose}>
                        {l.purpose || t.noPurpose}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{l.interest_rate}%</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{formatRupees(l.outstanding_amount)}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {l.disbursed_date ? new Date(l.disbursed_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <LoanStatusBadge status={l.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            {isSuperAdmin ? (
                              <div className="inline-flex gap-2">
                                <button
                                  disabled={loadingId === l.id}
                                  onClick={() => handleApprove(l.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                                >
                                  {t.approveBtn}
                                </button>
                                <button
                                  disabled={loadingId === l.id}
                                  onClick={() => handleReject(l.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                                >
                                  {t.rejectBtn}
                                </button>
                              </div>
                            ) : (
                              <span 
                                title="Awaiting SuperAdmin approval" 
                                className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-semibold px-3 py-1.5 rounded-xl text-xs cursor-help border border-gray-200/50 dark:border-gray-700/50"
                              >
                                {t.awaitingSuperAdminHint}
                              </span>
                            )}
                          </>
                        )}

                        {l.status === 'ACTIVE' && (
                          <div className="inline-flex gap-2">
                            <Link
                              href={`/loans/${l.id}`}
                              className="inline-flex bg-[#E85D26] hover:bg-[#D04E1A] text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                            >
                              {t.viewEmisBtn}
                            </Link>
                            {isSuperAdmin && (
                              <button
                                disabled={loadingId === l.id}
                                onClick={() => handleClose(l.id)}
                                className="bg-white dark:bg-gray-950 border border-red-500 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                              >
                                {t.closeBtn.split(' ')[0]}
                              </button>
                            )}
                          </div>
                        )}

                        {(l.status === 'CLOSED' || l.status === 'REJECTED') && (
                          <Link
                            href={`/loans/${l.id}`}
                            className="inline-flex border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition bg-white dark:bg-gray-950"
                          >
                            {t.viewBtn}
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
