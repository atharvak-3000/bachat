"use client"

import { useState, useEffect } from "react"
import { MeetingWithDetails, Member, LoanWithEmis, Organization, MeetingContributionWithMember, MeetingIncome, MeetingExpense, LoanEmi } from "@/types"
import { useSearchParams, useRouter } from "next/navigation"

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function ReportsClient({
  meetings,
  members,
  loans,
  organization,
}: {
  meetings: MeetingWithDetails[]
  members: Member[]
  loans: LoanWithEmis[]
  organization: Organization
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get("tab") || "monthly"

  const [selectedMeetingId, setSelectedMeetingId] = useState(meetings[0]?.id || "")

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
      reportsTitle: "अहवाल",
      printReport: "अहवाल प्रिंट करा",
      tabMonthly: "मासिक सारांश",
      tabMembers: "सदस्य अहवाल",
      tabLoans: "कर्ज अहवाल",
      tabAttendance: "उपस्थिती अहवाल",
      meetingLabel: "सभा",
      dateLabel: "दिनांक",
      financialSummary: "वित्तीय सारांश",
      openingBalance: "सुरुवातीची शिल्लक",
      totalSavings: "एकूण बचत",
      penalties: "दंड",
      loanRepaid: "कर्ज परतफेड",
      interest: "व्याज",
      otherIncome: "इतर उत्पन्न",
      totalReceipts: "एकूण जमा",
      loansIssued: "दिलेली कर्जे",
      otherExpenses: "इतर खर्च",
      totalExpenses: "एकूण खर्च",
      closingBalance: "अखेरची शिल्लक",
      memberContributions: "सदस्य योगदान",
      noMeetingText: "कोणतीही सभा निवडलेली नाही किंवा उपलब्ध नाही.",
      nameCol: "नाव",
      presentCol: "हजर",
      savingsCol: "बचत",
      repaymentCol: "परतफेड",
      interestCol: "व्याज",
      penaltyCol: "दंड",
      totals: "एकूण",
      totalDisbursedCard: "एकूण वितरित कर्ज",
      totalOutstandingCard: "एकूण थकबाकी",
      totalRecoveredCard: "एकूण वसूल",
      recoveryRateCard: "वसुली दर",
      npaTitle: "थकीत कर्जे (NPA - ९० दिवसांपेक्षा जास्त थकीत)",
      outstandingPrefix: "थकबाकी",
      activeLoansTitle: "सक्रिय कर्जे",
      memberCol: "सदस्य",
      disbursedDateCol: "वितरित तारीख",
      amountCol: "कर्ज रक्कम",
      outstandingCol: "थकबाकी",
      interestRateCol: "व्याज दर",
      emisPaidCol: "भरलेले EMI",
      noActiveLoans: "कोणतेही सक्रिय कर्ज नाही",
      netPosition: "निव्वळ स्थिती",
    },
    en: {
      reportsTitle: "Reports",
      printReport: "Print Report",
      tabMonthly: "Monthly Summary",
      tabMembers: "Member Report",
      tabLoans: "Loan Report",
      tabAttendance: "Attendance Report",
      meetingLabel: "Meeting",
      dateLabel: "Date",
      financialSummary: "Financial Summary",
      openingBalance: "Opening Balance",
      totalSavings: "Total Savings",
      penalties: "Penalties",
      loanRepaid: "Loan Repaid",
      interest: "Interest",
      otherIncome: "Other Income",
      totalReceipts: "TOTAL RECEIPTS",
      loansIssued: "Loans Issued",
      otherExpenses: "Other Expenses",
      totalExpenses: "TOTAL EXPENSES",
      closingBalance: "CLOSING BALANCE",
      memberContributions: "Member Contributions",
      noMeetingText: "No meeting selected or available.",
      nameCol: "Name",
      presentCol: "Pre",
      savingsCol: "Sav",
      repaymentCol: "Rep",
      interestCol: "Int",
      penaltyCol: "Pen",
      totals: "Totals",
      totalDisbursedCard: "Total Disbursed",
      totalOutstandingCard: "Total Outstanding",
      totalRecoveredCard: "Total Recovered",
      recoveryRateCard: "Recovery Rate",
      npaTitle: "Non-Performing Assets (Overdue > 90 days)",
      outstandingPrefix: "Outstanding",
      activeLoansTitle: "Active Loans",
      memberCol: "Member",
      disbursedDateCol: "Disbursed Date",
      amountCol: "Amount",
      outstandingCol: "Outstanding",
      interestRateCol: "Rate",
      emisPaidCol: "EMIs Paid",
      noActiveLoans: "No active loans",
      netPosition: "Net Position",
    }
  }
  const t = T[lang]

  const setTab = (newTab: string) => {
    router.push(`/reports?tab=${newTab}`)
  }

  // Monthly Summary Calculations
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId)
  
  let totalSavings = 0
  let totalPenalties = 0
  let totalLoanRepaid = 0
  let totalInterest = 0
  let totalOtherIncome = 0
  
  if (selectedMeeting) {
    selectedMeeting.meeting_contributions.forEach((c: MeetingContributionWithMember) => {
      totalSavings += c.savings_amount
      totalPenalties += c.penalty_paid
      totalLoanRepaid += c.loan_repayment
      totalInterest += c.interest_paid
      totalOtherIncome += c.other_amount
    })
    selectedMeeting.meeting_income.forEach((i: MeetingIncome) => {
      totalOtherIncome += i.amount
    })
  }

  const totalReceipts = totalSavings + totalPenalties + totalLoanRepaid + totalInterest + totalOtherIncome
  
  // Expenses and Loans Issued
  let totalExpenses = 0
  let loansIssued = 0 // Needs to come from loans created between this meeting and next/previous? Actually, for simplicity we assume it's recorded somewhere or we can approximate.
  // Wait, API has `api/meetings/[id]/loans-issued`. 
  // Let's just calculate loans disbursed in this month.
  if (selectedMeeting) {
    const meetingDate = new Date(selectedMeeting.meeting_date)
    const month = meetingDate.getMonth()
    const year = meetingDate.getFullYear()
    
    loans.forEach(l => {
      if (l.status === 'ACTIVE' || l.status === 'CLOSED') {
        const dDate = new Date(l.disbursed_date)
        if (dDate.getMonth() === month && dDate.getFullYear() === year) {
          loansIssued += l.loan_amount
        }
      }
    })

    selectedMeeting.meeting_expenses.forEach((e: MeetingExpense) => {
      totalExpenses += e.amount
    })
  }
  
  const totalTotalExpenses = totalExpenses + loansIssued
  const closingBalance = (selectedMeeting?.opening_balance || 0) + totalReceipts - totalTotalExpenses

  // Member Report Calculations
  const memberStats = members.map(m => {
    let tSavings = 0
    let tInterest = 0
    let meetingsPresent = 0
    let totalMeetings = 0

    meetings.forEach(mtg => {
      if (mtg.status === 'FINALIZED') {
        totalMeetings++
        const c = mtg.meeting_contributions.find((c: MeetingContributionWithMember) => c.member_id === m.id)
        if (c) {
          tSavings += c.savings_amount
          tInterest += c.interest_paid
          if (c.is_present) meetingsPresent++
        }
      }
    })

    const activeLoan = loans.find(l => l.member_id === m.id && l.status === 'ACTIVE')
    const netPosition = tSavings - (activeLoan ? activeLoan.outstanding_amount : 0)

    return {
      ...m,
      totalSavings: tSavings,
      totalInterest: tInterest,
      attendance: totalMeetings > 0 ? (meetingsPresent / totalMeetings) * 100 : 0,
      activeLoanAmount: activeLoan ? activeLoan.outstanding_amount : 0,
      netPosition
    }
  })

  // Loan Report Calculations
  const totalDisbursed = loans.filter(l => l.status === 'ACTIVE' || l.status === 'CLOSED').reduce((sum, l) => sum + l.loan_amount, 0)
  const totalOutstanding = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.outstanding_amount, 0)
  const totalRecovered = totalDisbursed - totalOutstanding
  const recoveryRate = totalDisbursed > 0 ? (totalRecovered / totalDisbursed) * 100 : 0
  
  const activeLoans = loans.filter(l => l.status === 'ACTIVE')
  
  // NPA List (Overdue > 90 days)
  const npaList = activeLoans.filter(l => {
    return l.loan_emis.some((emi: LoanEmi) => {
      if (emi.status === 'OVERDUE' || emi.status === 'PENDING') {
        const daysOverdue = Math.floor((Date.now() - new Date(emi.due_date).getTime()) / 86400000)
        return daysOverdue > 90
      }
      return false
    })
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B6B] dark:text-white">{t.reportsTitle}</h1>
        <button onClick={handlePrint} className="print:hidden bg-[#E85D26] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D04E1A] shadow-sm transition">
          {t.printReport}
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 text-sm font-semibold overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none print:hidden mb-6">
        <button onClick={() => setTab("monthly")} className={`px-4 py-2 text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${tab === "monthly" ? "border-b-2 border-[#E85D26] text-[#E85D26]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t.tabMonthly}</button>
        <button onClick={() => setTab("members")} className={`px-4 py-2 text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${tab === "members" ? "border-b-2 border-[#E85D26] text-[#E85D26]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t.tabMembers}</button>
        <button onClick={() => setTab("loans")} className={`px-4 py-2 text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${tab === "loans" ? "border-b-2 border-[#E85D26] text-[#E85D26]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t.tabLoans}</button>
        <button onClick={() => setTab("attendance")} className={`px-4 py-2 text-sm font-bold whitespace-nowrap flex-shrink-0 transition-colors ${tab === "attendance" ? "border-b-2 border-[#E85D26] text-[#E85D26]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t.tabAttendance}</button>
      </div>

      {tab === "monthly" && (
        <div>
          <div className="mb-4 print:hidden">
            <select 
              value={selectedMeetingId} 
              onChange={e => setSelectedMeetingId(e.target.value)}
              className="border border-gray-200 dark:border-gray-800 p-2 rounded-lg text-sm font-semibold focus:border-[#E85D26] focus:ring-1 focus:ring-[#E85D26] outline-none bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition"
            >
              {meetings.map(m => (
                <option key={m.id} value={m.id} className="dark:bg-gray-950 dark:text-white">{m.month_year} - {new Date(m.meeting_date).toLocaleDateString('en-IN')}</option>
              ))}
            </select>
          </div>

          {selectedMeeting ? (
            <div className="bg-white dark:bg-[#1A1D27] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-center mb-6 border-b dark:border-gray-800 pb-4">
                <h2 className="text-xl font-bold uppercase text-[#1B2B6B] dark:text-white">{organization.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t.meetingLabel}: {selectedMeeting.month_year}</p>
                <p className="text-gray-500 dark:text-gray-400">{t.dateLabel}: {new Date(selectedMeeting.meeting_date).toLocaleDateString('en-IN')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-[#1B2B6B] dark:text-white mb-4">{t.financialSummary}</h3>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-white">
                    <div className="flex justify-between"><span className="font-medium">{t.openingBalance}:</span> <span>{formatRupees(selectedMeeting.opening_balance)}</span></div>
                    <hr className="my-2 border-gray-150 dark:border-gray-800" />
                    <div className="flex justify-between"><span>{t.totalSavings}:</span> <span>{formatRupees(totalSavings)}</span></div>
                    <div className="flex justify-between"><span>{t.penalties}:</span> <span>{formatRupees(totalPenalties)}</span></div>
                    <div className="flex justify-between"><span>{t.loanRepaid}:</span> <span>{formatRupees(totalLoanRepaid)}</span></div>
                    <div className="flex justify-between"><span>{t.interest}:</span> <span>{formatRupees(totalInterest)}</span></div>
                    <div className="flex justify-between"><span>{t.otherIncome}:</span> <span>{formatRupees(totalOtherIncome)}</span></div>
                    <hr className="my-2 border-black dark:border-gray-600" />
                    <div className="flex justify-between font-bold"><span>{t.totalReceipts}:</span> <span>{formatRupees(totalReceipts)}</span></div>
                    <hr className="my-2 border-black dark:border-gray-600" />
                    <div className="flex justify-between"><span>{t.loansIssued}:</span> <span>{formatRupees(loansIssued)}</span></div>
                    <div className="flex justify-between"><span>{t.otherExpenses}:</span> <span>{formatRupees(totalExpenses)}</span></div>
                    <hr className="my-2 border-black dark:border-gray-600" />
                    <div className="flex justify-between font-bold"><span>{t.totalExpenses}:</span> <span>{formatRupees(totalTotalExpenses)}</span></div>
                    <hr className="my-2 border-black dark:border-gray-600 border-2" />
                    <div className={`flex justify-between text-lg font-bold ${closingBalance >= 0 ? 'text-[#2E4099] dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}><span>{t.closingBalance}:</span> <span>{formatRupees(closingBalance)}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[#1B2B6B] dark:text-white mb-4">{t.memberContributions}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold border-b dark:border-gray-800">
                          <th className="p-2">{t.nameCol}</th>
                          <th className="p-2">{t.presentCol}</th>
                          <th className="p-2 text-right">{t.savingsCol}</th>
                          <th className="p-2 text-right">{t.repaymentCol}</th>
                          <th className="p-2 text-right">{t.interestCol}</th>
                          <th className="p-2 text-right">{t.penaltyCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMeeting.meeting_contributions.map((c: MeetingContributionWithMember) => (
                          <tr key={c.id} className="border-b dark:border-gray-800 text-gray-900 dark:text-white hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition">
                            <td className="p-2 truncate max-w-[120px]" title={c.member.name}>{c.member.name}</td>
                            <td className="p-2 text-gray-600 dark:text-gray-300">{c.is_present ? '✓' : '✗'}</td>
                            <td className="p-2 text-right">{formatRupees(c.savings_amount)}</td>
                            <td className="p-2 text-right">{formatRupees(c.loan_repayment)}</td>
                            <td className="p-2 text-right">{formatRupees(c.interest_paid)}</td>
                            <td className="p-2 text-right">{formatRupees(c.penalty_paid)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 font-medium italic">{t.noMeetingText}</p>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="bg-white dark:bg-[#1A1D27] p-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold border-b dark:border-gray-800">
                <th className="p-3">#</th>
                <th className="p-3">{t.nameCol}</th>
                <th className="p-3 text-right">{t.totalSavings}</th>
                <th className="p-3 text-right">{t.tabLoans}</th>
                <th className="p-3 text-right">{t.interestCol}</th>
                <th className="p-3 text-center">{t.tabAttendance} %</th>
                <th className="p-3 text-right">{t.netPosition || "निव्वळ स्थिती"}</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map(m => (
                <tr key={m.id} className="border-b dark:border-gray-800 hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition">
                  <td className="p-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{m.member_number}</td>
                  <td className="p-3 font-semibold text-gray-800 dark:text-white">{m.name}</td>
                  <td className="p-3 text-right text-[#2E4099] dark:text-blue-400 font-semibold">{formatRupees(m.totalSavings)}</td>
                  <td className="p-3 text-right text-[#E85D26] dark:text-orange-400 font-semibold">{formatRupees(m.activeLoanAmount)}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{formatRupees(m.totalInterest)}</td>
                  <td className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">{m.attendance.toFixed(0)}%</td>
                  <td className={`p-3 text-right font-bold ${m.netPosition >= 0 ? 'text-[#2E4099] dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{formatRupees(m.netPosition)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-950 font-bold text-[#1B2B6B] dark:text-white">
                <td colSpan={2} className="p-3 text-right">{t.totals}:</td>
                <td className="p-3 text-right text-[#2E4099] dark:text-blue-400">{formatRupees(memberStats.reduce((sum, m) => sum + m.totalSavings, 0))}</td>
                <td className="p-3 text-right text-[#E85D26] dark:text-orange-400">{formatRupees(memberStats.reduce((sum, m) => sum + m.activeLoanAmount, 0))}</td>
                <td className="p-3 text-right">{formatRupees(memberStats.reduce((sum, m) => sum + m.totalInterest, 0))}</td>
                <td className="p-3 text-center">-</td>
                <td className={`p-3 text-right font-black ${memberStats.reduce((sum, m) => sum + m.netPosition, 0) >= 0 ? 'text-[#2E4099] dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{formatRupees(memberStats.reduce((sum, m) => sum + m.netPosition, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === "loans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
              <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.totalDisbursedCard}</span>
              <p className="text-lg md:text-2xl font-black text-[#2E4099] dark:text-blue-400 mt-1.5 md:mt-2 break-all">{formatRupees(totalDisbursed)}</p>
            </div>
            <div className="bg-[#1B2B6B] border border-[#1B2B6B] dark:bg-[#0D1021] dark:border-blue-900/30 p-4 md:p-6 rounded-3xl shadow-md text-white">
              <span className="text-[10px] md:text-xs font-bold text-white/70 dark:text-white/60 uppercase tracking-wider leading-tight block">{t.totalOutstandingCard}</span>
              <p className="text-lg md:text-2xl font-black text-white mt-1.5 md:mt-2 break-all">{formatRupees(totalOutstanding)}</p>
            </div>
            <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
              <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.totalRecoveredCard}</span>
              <p className="text-lg md:text-2xl font-black text-green-600 dark:text-green-400 mt-1.5 md:mt-2 break-all">{formatRupees(totalRecovered)}</p>
            </div>
            <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 md:p-6 rounded-3xl shadow-sm">
              <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.recoveryRateCard}</span>
              <p className="text-lg md:text-2xl font-black text-gray-900 dark:text-white mt-1.5 md:mt-2">{recoveryRate.toFixed(1)}%</p>
            </div>
          </div>

          {npaList.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">{t.npaTitle}</h3>
              <ul className="list-disc pl-5 text-red-700 dark:text-red-300 text-sm">
                {npaList.map(l => (
                  <li key={l.id}>{l.member.name} - {t.outstandingPrefix}: {formatRupees(l.outstanding_amount)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white dark:bg-[#1A1D27] p-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto shadow-sm">
            <h3 className="font-bold text-[#1B2B6B] dark:text-white mb-4">{t.activeLoansTitle}</h3>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold border-b dark:border-gray-800">
                  <th className="p-3">{t.memberCol}</th>
                  <th className="p-3">{t.disbursedDateCol}</th>
                  <th className="p-3 text-right">{t.amountCol}</th>
                  <th className="p-3 text-right">{t.outstandingCol}</th>
                  <th className="p-3 text-center">{t.interestRateCol}</th>
                  <th className="p-3 text-center">{t.emisPaidCol}</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(l => {
                  const paidEmis = l.loan_emis.filter((e: LoanEmi) => e.status === 'PAID').length
                  return (
                    <tr key={l.id} className="border-b dark:border-gray-800 hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition">
                      <td className="p-3 font-semibold text-gray-800 dark:text-white">{l.member.name}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(l.disbursed_date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right text-gray-900 dark:text-white">{formatRupees(l.loan_amount)}</td>
                      <td className="p-3 text-right text-[#E85D26] dark:text-orange-400 font-semibold">{formatRupees(l.outstanding_amount)}</td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-300">{l.interest_rate}%</td>
                      <td className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium">{paidEmis}/{l.term_months}</td>
                    </tr>
                  )
                })}
                {activeLoans.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400 font-medium italic">{t.noActiveLoans}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="bg-white dark:bg-[#1A1D27] p-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead>
              <tr>
                <th className="p-2 border-b border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold min-w-[150px]">{t.memberCol}</th>
                {meetings.slice(0, 12).map((m, idx) => (
                  <th key={m.id} className={`p-2 border-b dark:border-gray-800 text-center bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold text-xs whitespace-nowrap ${idx >= 4 ? 'hidden md:table-cell' : ''}`}>
                    {new Date(m.meeting_date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short'
                    })}
                  </th>
                ))}
                <th className="p-2 border-b border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                let presentCount = 0
                let totalCount = 0
                return (
                  <tr key={m.id} className="border-b dark:border-gray-800 hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition">
                    <td className="p-2 border-r dark:border-gray-800 font-semibold text-gray-800 dark:text-white truncate max-w-[150px]">{m.name}</td>
                    {meetings.slice(0, 12).map((mtg, idx) => {
                      const c = mtg.meeting_contributions.find((c: MeetingContributionWithMember) => c.member_id === m.id)
                      let icon = <span className="text-gray-300 dark:text-gray-600">-</span>
                      if (c) {
                        totalCount++
                        if (c.is_present) {
                          presentCount++
                          icon = <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        } else {
                          icon = <span className="text-red-500 dark:text-red-400 font-bold">✗</span>
                        }
                      }
                      return <td key={mtg.id} className={`p-2 text-center border-r dark:border-gray-800 ${idx >= 4 ? 'hidden md:table-cell' : ''}`}>{icon}</td>
                    })}
                    <td className="p-2 border-l dark:border-gray-800 text-center font-bold text-[#1B2B6B] dark:text-white">
                      {totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) + '%' : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
