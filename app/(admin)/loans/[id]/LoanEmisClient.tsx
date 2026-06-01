"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatRupees, toR } from "@/lib/calculations"
import Link from "next/link"
import type { Loan, LoanEmi, Member } from "@/types"

interface LoanWithMember extends Loan {
  member: Member
}

export default function LoanEmisClient({
  loan,
  initialEmis
}: {
  loan: LoanWithMember
  initialEmis: LoanEmi[]
}) {
  const router = useRouter()
  const [emis, setEmis] = useState<LoanEmi[]>(initialEmis)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmi, setSelectedEmi] = useState<LoanEmi | null>(null)
  
  const [formData, setFormData] = useState({
    principal_paid: "",
    interest_paid: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      backToList: "← कर्ज सूचीवर परत जा",
      loanDetailsHeader: "कर्ज माहिती",
      purposeLabel: "हेतू:",
      rateLabel: "व्याज दर:",
      monthsLabel: "महिने:",
      repaymentProgress: "परतफेड प्रगती",
      paidPercent: "भरले",
      repaidAmount: "एकूण परतफेड:",
      outstandingAmount: "थकीत रक्कम:",
      statusLabel: "कर्ज स्थिती",
      pendingApproval: "मंजुरी प्रलंबित",
      activeStatus: "चालू",
      closedStatus: "बंद",
      rejectedStatus: "नाकारले",
      reasonLabel: "कारण:",
      emiScheduleTitle: "EMI परतफेड वेळापत्रक",
      emiScheduleSub: "मासिक देय रक्कम, भरलेली रक्कम आणि स्थितीचे वेळापत्रक.",
      monthCol: "महिना",
      dueDateCol: "देय तारीख",
      principalDueCol: "मुद्दल देय",
      interestDueCol: "व्याज देय",
      totalDueCol: "एकूण देय",
      paidSoFarCol: "एकूण भरले",
      statusCol: "स्थिती",
      actionCol: "कृती",
      paidBadge: "Paid",
      partialBadge: "Partial",
      overdueBadge: "Overdue",
      pendingBadge: "Pending",
      markPaidBtn: "जमा करा",
      recordPaymentTitle: "हप्ता जमा करा",
      principalPaidLabel: "मुद्दल जमा (₹)",
      interestPaidLabel: "व्याज जमा (₹)",
      dueLabel: "शिल्लक देय:",
      totalLabel: "एकूण:",
      cancelBtn: "रद्द करा",
      recordingBtn: "जमा करत आहे...",
      recordBtn: "जमा करा",
      defaultPurpose: "वैयक्तिक / सर्वसाधारण",
    },
    en: {
      backToList: "← Back to Loans List",
      loanDetailsHeader: "Loan Details",
      purposeLabel: "Purpose:",
      rateLabel: "Rate:",
      monthsLabel: "Months:",
      repaymentProgress: "Repayment Progress",
      paidPercent: "Paid",
      repaidAmount: "Repaid:",
      outstandingAmount: "Outstanding:",
      statusLabel: "Loan Status",
      pendingApproval: "Pending Approval",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      reasonLabel: "Reason:",
      emiScheduleTitle: "EMI Repayment Schedule",
      emiScheduleSub: "List of all scheduled monthly payments, paid amounts, and statuses.",
      monthCol: "Month",
      dueDateCol: "Due Date",
      principalDueCol: "Principal Due",
      interestDueCol: "Interest Due",
      totalDueCol: "Total Due",
      paidSoFarCol: "Paid So Far",
      statusCol: "Status",
      actionCol: "Action",
      paidBadge: "Paid",
      partialBadge: "Partial",
      overdueBadge: "Overdue",
      pendingBadge: "Pending",
      markPaidBtn: "Mark Paid",
      recordPaymentTitle: "Record EMI Payment",
      principalPaidLabel: "Principal Paid (₹)",
      interestPaidLabel: "Interest Paid (₹)",
      dueLabel: "Due:",
      totalLabel: "Total:",
      cancelBtn: "Cancel",
      recordingBtn: "Recording...",
      recordBtn: "Record Payment",
      defaultPurpose: "Personal / General",
    }
  }
  const t = T[lang]

  const progressPercent = Math.min(
    100,
    Math.round(((loan.loan_amount - loan.outstanding_amount) / loan.loan_amount) * 100)
  )

  const openPaymentModal = (emi: LoanEmi) => {
    setSelectedEmi(emi)
    // Pre-populate with the remaining due amounts
    const remainingPrincipal = Math.max(0, emi.principal_due - emi.principal_paid)
    const remainingInterest = Math.max(0, emi.interest_due - emi.interest_paid)
    
    setFormData({
      principal_paid: toR(remainingPrincipal).toString(),
      interest_paid: toR(remainingInterest).toString()
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmi) return
    
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/loans/${loan.id}/emis/${selectedEmi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal_paid: formData.principal_paid || "0",
          interest_paid: formData.interest_paid || "0"
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to record payment")
      }

      setIsModalOpen(false)
      router.refresh()
      
      // Let's reload local details
      const refreshRes = await fetch(window.location.href)
      if (refreshRes.ok) {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Back Link */}
      <Link href="/loans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition font-medium">
        {t.backToList}
      </Link>

      {/* Main Loan Info */}
      <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{t.loanDetailsHeader}</span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {loan.member?.name} — {formatRupees(loan.loan_amount)}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {t.purposeLabel} <strong>{loan.purpose || t.defaultPurpose}</strong> | {t.rateLabel} <strong>{loan.interest_rate}%</strong> | {t.monthsLabel} <strong>{loan.term_months}</strong>
            </p>
          </div>

          {/* Progress Bar */}
          {loan.status === 'ACTIVE' || loan.status === 'CLOSED' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>{t.repaymentProgress}</span>
                <span className="text-orange-600 dark:text-orange-400">{progressPercent}% {t.paidPercent}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                <span>{t.repaidAmount} {formatRupees(loan.loan_amount - loan.outstanding_amount)}</span>
                <span>{t.outstandingAmount} {formatRupees(loan.outstanding_amount)}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{t.statusLabel}</span>
          <div>
            {loan.status === 'PENDING' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                {t.pendingApproval}
              </span>
            ) : loan.status === 'ACTIVE' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                {t.activeStatus}
              </span>
            ) : loan.status === 'CLOSED' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                {t.closedStatus}
              </span>
            ) : (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                {t.rejectedStatus}
              </span>
            )}
          </div>
          {loan.rejection_reason && (
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">{t.reasonLabel} {loan.rejection_reason}</p>
          )}
        </div>
      </div>

      {/* EMI Schedule Table */}
      <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.emiScheduleTitle}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t.emiScheduleSub}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-semibold text-xs border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider">
                <th className="px-6 py-4">{t.monthCol}</th>
                <th className="px-6 py-4">{t.dueDateCol}</th>
                <th className="px-6 py-4">{t.principalDueCol}</th>
                <th className="px-6 py-4">{t.interestDueCol}</th>
                <th className="px-6 py-4">{t.totalDueCol}</th>
                <th className="px-6 py-4">{t.paidSoFarCol}</th>
                <th className="px-6 py-4">{t.statusCol}</th>
                <th className="px-6 py-4 text-right">{t.actionCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium">
              {emis.map((e) => {
                const totalDue = e.principal_due + e.interest_due
                const totalPaid = e.principal_paid + e.interest_paid
                const isOverdue = e.status !== 'PAID' && new Date(e.due_date) < new Date()
                
                return (
                  <tr key={e.id} className={`hover:bg-gray-50/50 dark:hover:bg-blue-950/10 ${isOverdue ? "bg-red-50/10 dark:bg-red-950/5" : ""}`}>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {e.month_year}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(e.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatRupees(e.principal_due)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatRupees(e.interest_due)}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">{formatRupees(totalDue)}</td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-bold">{formatRupees(totalPaid)}</td>
                    <td className="px-6 py-4">
                      {e.status === 'PAID' ? (
                        <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-150 dark:border-green-900/30">
                          {t.paidBadge}
                        </span>
                      ) : e.status === 'PARTIAL' ? (
                        <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30">
                          {t.partialBadge}
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-150 dark:border-red-900/30 animate-pulse">
                          {t.overdueBadge}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-150 dark:border-gray-700/30">
                          {t.pendingBadge}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === 'ACTIVE' && e.status !== 'PAID' ? (
                        <button
                          onClick={() => openPaymentModal(e)}
                          className="bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold px-3.5 py-1.5 rounded-xl text-xs active:scale-95 transition"
                        >
                          {t.markPaidBtn}
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && selectedEmi && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 animate-scaleUp">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.recordPaymentTitle}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{t.monthCol}: {selectedEmi.month_year}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-xl transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl p-3.5 mb-5 text-sm flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.principalPaidLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.principal_paid}
                  onChange={(e) => setFormData({ ...formData, principal_paid: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition dark:bg-gray-950 dark:text-white"
                />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                  {t.dueLabel} {formatRupees(selectedEmi.principal_due - selectedEmi.principal_paid)} ({t.totalLabel} {formatRupees(selectedEmi.principal_due)})
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.interestPaidLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.interest_paid}
                  onChange={(e) => setFormData({ ...formData, interest_paid: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition dark:bg-gray-950 dark:text-white"
                />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                  {t.dueLabel} {formatRupees(selectedEmi.interest_due - selectedEmi.interest_paid)} ({t.totalLabel} {formatRupees(selectedEmi.interest_due)})
                </span>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold p-3 rounded-xl transition text-sm text-center"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold p-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {loading ? t.recordingBtn : t.recordBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
