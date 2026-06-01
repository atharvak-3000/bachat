import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { formatRupees, formatMonthYear } from "@/lib/calculations"
import type { MeetingContribution, Meeting, Loan } from "@/types"
import PrintButton from "./PrintButton"
import { cookies } from "next/headers"
import { getTranslation } from "@/lib/translations"

export default async function MemberPassbookPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get("language")?.value || "en") as "en" | "mr"
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  let performer
  try {
    performer = await requireAuth()
  } catch {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  // Fetch all contributions for this member with meetings
  const { data: contribs, error: contribsError } = await supabase
    .from("meeting_contributions")
    .select("*, meeting:meetings(*)")
    .eq("member_id", performer.id)

  if (contribsError) console.error("Error fetching contributions for passbook:", contribsError)

  // Fetch all loans for this member (excluding rejected ones)
  const { data: loans, error: loansError } = await supabase
    .from("loans")
    .select("*")
    .eq("member_id", performer.id)
    .neq("status", "REJECTED")

  if (loansError) console.error("Error fetching loans for passbook:", loansError)

  const memberContribs = (contribs || []) as (MeetingContribution & { meeting: Meeting })[]
  const myLoans = (loans || []) as Loan[]

  // Filter finalized contributions and sort chronologically (oldest first)
  const finalizedContribs = memberContribs
    .filter((c) => c.meeting && c.meeting.status === 'FINALIZED')
    .sort((a, b) => new Date(a.meeting.meeting_date).getTime() - new Date(b.meeting.meeting_date).getTime())

  // Compute ledger entries
  let runningSavings = 0
  let runningOutstandingLoan = 0

  const ledgerEntries = finalizedContribs.map((c) => {
    // 1. Accumulate savings
    runningSavings += c.savings_amount || 0

    // 2. Align any loan disbursed in this meeting's month_year
    const meetingMonth = c.meeting.month_year
    const loanDisbursed = myLoans.find((l) => {
      if (!l.disbursed_date) return false
      const loanMonth = l.disbursed_date.substring(0, 7) // YYYY-MM
      return loanMonth === meetingMonth
    })

    const loanAmountDisbursed = loanDisbursed ? loanDisbursed.loan_amount : 0

    // 3. Accumulate/Reduce outstanding loan balance
    if (loanAmountDisbursed > 0) {
      runningOutstandingLoan += loanAmountDisbursed
    }
    runningOutstandingLoan -= (c.loan_repayment || 0)

    // Ensure we don't display negative outstanding loan balance due to floating point or minor rounding
    if (runningOutstandingLoan < 0) {
      runningOutstandingLoan = 0
    }

    return {
      id: c.id,
      month_year: c.meeting.month_year,
      meeting_date: c.meeting.meeting_date,
      is_present: c.is_present,
      savings_amount: c.savings_amount || 0,
      loan_disbursed: loanAmountDisbursed,
      loan_repayment: c.loan_repayment || 0,
      interest_paid: c.interest_paid || 0,
      penalty_paid: c.penalty_paid || 0,
      running_savings: runningSavings,
      outstanding_loan: runningOutstandingLoan,
    }
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CSS print overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, main, .print-area, .print-area *, .print-area div, .print-area p, .print-area span, .print-area h2, .print-area strong, .print-area table, .print-area th, .print-area td {
            background-color: white !important;
            background: white !important;
            color: black !important;
            border-color: #cbd5e1 !important;
          }
          header, nav, footer, .no-print, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 10px !important;
            font-size: 11px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
          }
        }
      ` }} />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-850 no-print">
        <div>
          <h1 className="text-[#1B2B6B] dark:text-white font-bold text-2xl">
            {t("myPassbook")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            View your complete transaction history, running savings balance, and outstanding loans.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Passbook Card */}
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-250 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 print-area">
        {/* Passbook Cover Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b-2 border-dashed border-[#E85D26]/30 dark:border-orange-500/20">
          <div className="space-y-1">
            <h2 className="text-[#1B2B6B] dark:text-white font-black text-xl tracking-wide">BACHATBOOK PASSBOOK</h2>
            <p className="text-[#E85D26] dark:text-orange-400 text-xs font-bold tracking-widest uppercase">Official Member Transaction Ledger</p>
          </div>
          <div className="text-left sm:text-right space-y-1 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-850">
            <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">{t("groupName")}</p>
            <p className="text-[#1B2B6B] dark:text-white font-semibold text-sm">{performer.organization.name}</p>
          </div>
        </div>

        {/* Member Details block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-xl border border-gray-100 dark:border-gray-850">
          <div>
            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">{t("memberName")}</span>
            <strong className="text-[#1B2B6B] dark:text-white font-semibold text-sm block">{performer.name}</strong>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">{t("memberNo")}</span>
            <strong className="text-[#1B2B6B] dark:text-white font-semibold text-sm block font-mono">#{performer.member_number}</strong>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">{t("mobileNo")}</span>
            <strong className="text-[#1B2B6B] dark:text-white font-semibold text-sm block font-mono">{performer.phone}</strong>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">{t("kycStatus")}</span>
            {performer.kyc_status === 'VERIFIED' ? (
              <span className="text-green-600 dark:text-green-400 font-semibold block text-sm">✓ {t("verified")}</span>
            ) : (
              <span className="text-[#E85D26] dark:text-orange-400 font-semibold block text-sm">{t("pending")}</span>
            )}
          </div>
        </div>

        {/* MOBILE SUMMARY - show above table on mobile */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-4 no-print">
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-3 border border-green-100 dark:border-green-900/30">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t("mySavings")}</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatRupees(ledgerEntries[ledgerEntries.length-1]
                ?.running_savings || 0)}
            </p>
          </div>
          <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-xl p-3 border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs text-[#E85D26] dark:text-orange-400 font-medium">{t("activeLoanDue")}</p>
            <p className="text-lg font-bold text-[#E85D26] dark:text-orange-400">
              {formatRupees(ledgerEntries[ledgerEntries.length-1]
                ?.outstanding_loan || 0)}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#1B2B6B] dark:bg-gray-950 text-white text-xs font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800">{t("month")}</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800">{t("date")}</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-center">{t("attendance")}</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right">{t("saving")} (+)</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right">{t("loans")} Disbursed (-)</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right">{t("principal")} Repaid (+)</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right">{t("interest")} Paid (+)</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right">{t("penalty")} Paid (+)</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right font-bold">{t("mySavings")}</th>
                <th className="px-4 py-3 border-b border-white/10 dark:border-gray-800 text-right font-bold">{t("activeLoanDue")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="odd:bg-white odd:dark:bg-[#1A1D27] even:bg-gray-50 even:dark:bg-gray-950/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-colors border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {formatMonthYear(entry.month_year)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(entry.meeting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    {entry.is_present ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">{t("present")}</span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400 font-medium">{t("absent")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {entry.savings_amount > 0 ? `+${formatRupees(entry.savings_amount)}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400">
                    {entry.loan_disbursed > 0 ? `-${formatRupees(entry.loan_disbursed)}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {entry.loan_repayment > 0 ? `+${formatRupees(entry.loan_repayment)}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {entry.interest_paid > 0 ? `+${formatRupees(entry.interest_paid)}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {entry.penalty_paid > 0 ? `+${formatRupees(entry.penalty_paid)}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right bg-blue-50/20 dark:bg-blue-950/10 font-bold text-[#1B2B6B] dark:text-blue-400 text-sm">
                    {formatRupees(entry.running_savings)}
                  </td>
                  <td className="px-4 py-3 text-right bg-orange-50/20 dark:bg-orange-950/10 font-bold text-[#E85D26] dark:text-orange-400 text-sm">
                    {entry.outstanding_loan > 0 ? formatRupees(entry.outstanding_loan) : <span className="text-gray-400 dark:text-gray-600">Nil</span>}
                  </td>
                </tr>
              ))}

              {ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500 italic bg-white dark:bg-[#1A1D27]">
                    No finalized bachat gat meetings recorded yet. Your passbook will update once your admin finalizes a meeting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Audit footer */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
          <span>Ledger Auto-Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span>BachatBook System Verified Passbook</span>
        </div>
      </div>
    </div>
  )
}
