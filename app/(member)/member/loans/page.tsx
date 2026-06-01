"use client"

import { useState, useEffect } from "react"
import { formatRupees } from "@/lib/calculations"
import Link from "next/link"
import { getTranslation } from "@/lib/translations"

export default function MemberLoansPage() {
  const [member, setMember] = useState<any>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<"en" | "mr">("en")

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() as "en" | "mr"
      return "en"
    }
    setLang(getCookie("language") || "en")
    fetchData()
  }, [])

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const fetchData = async () => {
    try {
      const [memberRes, loansRes] = await Promise.all([
        fetch("/api/members/self"),
        fetch("/api/loans")
      ])

      if (memberRes.ok) {
        const data = await memberRes.json()
        setMember(data.member)
      }

      if (loansRes.ok) {
        const data = await loansRes.json()
        setLoans(data || [])
      }
    } catch (err) {
      console.error("Error fetching member loans data:", err)
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-150 dark:bg-gray-850 rounded-xl animate-pulse" />
        <div className="h-40 w-full bg-gray-150 dark:bg-gray-850 rounded-3xl animate-pulse" />
      </div>
    )
  }

  // Filter loans to show only member's own loans
  const myLoans = loans.filter((l) => l.member_id === member?.id)

  const activeLoans = myLoans.filter((l) => l.status === "ACTIVE")
  const pendingLoans = myLoans.filter((l) => l.status === "PENDING")
  const closedLoans = myLoans.filter((l) => l.status === "CLOSED" || l.status === "REJECTED")

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-850">
        <div>
          <h1 className="text-[#1B2B6B] dark:text-white font-bold text-2xl">
            {t("myLoans")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t("loansDesc")}
          </p>
        </div>
      </div>

      {/* Active Loans Section */}
      {activeLoans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            {t("activeLoanTitle")}
          </h2>
          {activeLoans.map((loan) => {
            const repaidAmount = loan.loan_amount - loan.outstanding_amount
            const progress = Math.min(100, Math.round((repaidAmount / loan.loan_amount) * 100))
            return (
              <div key={loan.id} className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-gray-850 pb-4">
                  <div>
                    <h3 className="text-[#1B2B6B] dark:text-white font-bold text-2xl">
                      {t("amount")}: {formatRupees(loan.loan_amount)}
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      {t("purpose")}: {loan.purpose || t("notSpecified")} • {t("disbursedOn")}: {new Date(loan.disbursed_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex px-2.5 py-1 bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      {loan.status}
                    </span>
                    <span className="inline-flex px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#E85D26] dark:text-orange-400 font-extrabold text-xs border border-orange-100/50 dark:border-orange-900/30">
                      {t("rate")}: {loan.interest_rate}% / {t("month")}
                    </span>
                    <span className="inline-flex px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/25 text-blue-700 dark:text-blue-400 font-extrabold text-xs border border-blue-100 dark:border-blue-900/30">
                      {t("term")}: {loan.term_months} {t("months")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span>{t("repaymentProgress")}</span>
                    <span className="text-[#E85D26] dark:text-orange-400 font-semibold">{progress}% {t("paid")}</span>
                  </div>
                  <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1B2B6B] dark:bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-semibold">
                    <span>{t("repaid")}: {formatRupees(repaidAmount)}</span>
                    <span>{t("remainingOutstanding")}: {formatRupees(loan.outstanding_amount)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  {/* Link to see EMIs page */}
                  <Link 
                    href={`/member/passbook`} 
                    className="bg-[#E85D26] hover:bg-[#D04E1A] text-white rounded-xl px-4 py-2 text-sm font-semibold transition inline-block"
                  >
                    {t("viewRepaymentsPassbook")}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pending Loans Section */}
      {pendingLoans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            {t("pendingApproval")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#1B2B6B] dark:text-white text-xl">{formatRupees(loan.loan_amount)}</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Requested on {new Date(loan.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30 rounded-full text-xs font-semibold px-2.5 py-1">
                    {t("pending")}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium space-y-1.5 border-t border-gray-150 dark:border-gray-800 pt-3">
                  <div className="flex justify-between">
                    <span>{t("requestedTerm")}:</span>
                    <strong className="text-gray-800 dark:text-white">{loan.term_months} {t("months")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("proposedInterest")}:</span>
                    <strong className="text-gray-800 dark:text-white">{loan.interest_rate}% / {t("month")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("purpose")}:</span>
                    <strong className="text-gray-800 dark:text-white">{loan.purpose || t("notSpecified")}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repayment History Section */}
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-[#1B2B6B] dark:text-white font-semibold text-base p-5 border-b border-gray-100 dark:border-gray-800">{t("loanHistory")}</h2>
        
        {closedLoans.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm italic text-center py-8">{t("noClosedLoans")}</p>
        ) : (
          <div className="overflow-x-auto p-5 pt-0">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#1B2B6B] dark:bg-gray-950 text-white text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3">{t("disbursedDate")}</th>
                    <th className="px-4 py-3">{t("amount")}</th>
                    <th className="px-4 py-3">{t("term")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("purpose")}</th>
                    <th className="px-4 py-3">{t("notesReason")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                  {closedLoans.map((loan) => (
                    <tr key={loan.id} className="odd:bg-white odd:dark:bg-[#1A1D27] even:bg-gray-50 even:dark:bg-gray-950/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-colors border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString('en-IN') : "-"}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1B2B6B] dark:text-white">{formatRupees(loan.loan_amount)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{loan.term_months} {t("months")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          loan.status === "CLOSED"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            : "bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30"
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{loan.purpose || "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 italic max-w-xs truncate">
                        {loan.rejection_reason || loan.closed_at ? `${t("closedOn")} ${new Date(loan.closed_at).toLocaleDateString('en-IN')}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
