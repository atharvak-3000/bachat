"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GroupCodeBadge } from "@/components/shared/CopyButton"
import { formatRupees, formatMonthYear } from "@/lib/calculations"
import type { ActivityLog, Member, Meeting, Loan } from "@/types"

interface DashboardClientProps {
  performer: any
  activeMembers: Member[]
  pendingMembers: Member[]
  totalCorpus: number
  totalOutstanding: number
  activeLoans: Loan[]
  pendingLoanCount: number
  currentMonth: string
  currentMeeting: Meeting | undefined
  overdueLoansList: (Loan & { member: Member; days_overdue: number; overdue_count: number })[]
  recentMeetings: (Meeting & { total_collected: number; closing_balance: number })[]
  logsList: ActivityLog[]
}

const roleBadge: Record<string, { labelMr: string; labelEn: string; className: string }> = {
  SUPERADMIN: { labelMr: "महाअध्यक्ष", labelEn: "SuperAdmin", className: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50" },
  MEMBER:     { labelMr: "सदस्य", labelEn: "Member", className: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50" },
}

export default function DashboardClient({
  performer,
  activeMembers,
  pendingMembers,
  totalCorpus,
  totalOutstanding,
  activeLoans,
  pendingLoanCount,
  currentMonth,
  currentMeeting,
  overdueLoansList,
  recentMeetings,
  logsList,
}: DashboardClientProps) {
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
      title: `नमस्कार, ${performer.name} 👋`,
      sub: `${performer.organization.name} — गट डॅशबोर्ड`,
      pendingRequestsBanner: `${pendingMembers.length} सदस्य विनंत्या प्रलंबित आहेत`,
      reviewRequests: "विनंत्या तपासा →",
      noMeetingRecordedBanner: `या महिन्याची (${formatMonthYear(currentMonth)}) सभा नोंदवली नाही`,
      createMeeting: "सभा तयार करा →",
      meetingNotFinalizedBanner: `या महिन्याची सभा (${formatMonthYear(currentMonth)}) अपूर्ण आहे`,
      enterDataFinalize: "नोंदणी करा आणि पूर्ण करा →",
      loansAwaitingBanner: `${pendingLoanCount} कर्ज मंजुरी प्रलंबित`,
      approveLoans: "कर्ज मंजूर करा →",
      activeMembersLabel: "सक्रिय सदस्य",
      totalCorpusLabel: "एकूण जमा निधी",
      outstandingLoansLabel: "येणे कर्ज",
      pendingRequestsLabel: "प्रलंबित विनंत्या",
      recentMeetingsTitle: "अलीकडील सभा",
      viewAllMeetings: "सर्व सभा पहा →",
      monthCol: "महिना",
      statusCol: "स्थिती",
      totalCollectedCol: "एकूण जमा",
      closingBalanceCol: "आजची शिल्लक",
      noMeetingsRecorded: "अद्याप कोणतीही सभा तयार केलेली नाही. सुरू करण्यासाठी पहिली सभा तयार करा.",
      overdueAccountsTitle: "⚠️ थकीत कर्ज खाती",
      emiUnpaid: "हप्ते थकले",
      daysOverdue: "दिवस थकीत",
      quickActionsTitle: "जलद पर्याय",
      newMeetingAction: "नवीन सभा",
      addMemberAction: "सदस्य जोडा",
      viewLoansAction: "कर्ज तपासा",
      recentActivityTitle: "अलीकडील क्रियाकलाप",
      logsSub: "तुमच्या बचत गटातील अलीकडील बदलांची नोंद.",
      noActivity: "अद्याप कोणताही क्रियाकलाप नोंदवला नाही.",
      approvalBannerTitle: "तुमचा बचत गट प्लॅटफॉर्म मंजुरीच्या प्रतीक्षेत आहे",
      approvalBannerSub: "तुमचा बचत गट पडताळणीच्या अधीन आहे. वाट पाहत असताना तुम्ही सदस्य जोडू शकता.",
      draftStatus: "अपूर्ण",
      finalizedStatus: "पूर्ण",
      activeCountText: "सक्रिय",
      membersInitial: "स",
      loansInitial: "क",
    },
    en: {
      title: `Welcome, ${performer.name} 👋`,
      sub: `${performer.organization.name} — Gat Dashboard`,
      pendingRequestsBanner: `${pendingMembers.length} member requests pending`,
      reviewRequests: "Review Requests →",
      noMeetingRecordedBanner: `No meeting recorded for ${formatMonthYear(currentMonth)}`,
      createMeeting: "Create Meeting →",
      meetingNotFinalizedBanner: `This month's meeting (${formatMonthYear(currentMonth)}) is not finalized`,
      enterDataFinalize: "Enter Data & Finalize →",
      loansAwaitingBanner: `${pendingLoanCount} loan(s) awaiting your approval`,
      approveLoans: "Approve Loans →",
      activeMembersLabel: "Active Members",
      totalCorpusLabel: "Total Corpus",
      outstandingLoansLabel: "Outstanding Loans",
      pendingRequestsLabel: "Pending Requests",
      recentMeetingsTitle: "Recent Meetings",
      viewAllMeetings: "View All Meetings →",
      monthCol: "Month",
      statusCol: "Status",
      totalCollectedCol: "Total Collected",
      closingBalanceCol: "Closing Balance",
      noMeetingsRecorded: "No meetings created yet. Create your first meeting to start.",
      overdueAccountsTitle: "⚠️ Overdue Accounts",
      emiUnpaid: "EMI unpaid",
      daysOverdue: "days overdue",
      quickActionsTitle: "Quick Actions",
      newMeetingAction: "New Meeting",
      addMemberAction: "Add Member",
      viewLoansAction: "View Loans",
      recentActivityTitle: "Recent Activity",
      logsSub: "Logs of recent changes in your Bachat Gat.",
      noActivity: "No activity logged yet.",
      approvalBannerTitle: "Your Bachat Gat is under review",
      approvalBannerSub: "Your Bachat Gat is under review. You can set up members while waiting.",
      draftStatus: "Draft",
      finalizedStatus: "Finalized",
      activeCountText: "Active",
      membersInitial: "m",
      loansInitial: "l",
    }
  }
  const t = T[lang]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Alert banners block */}
      <div className="space-y-3">
        {/* Org approval banner */}
        {!performer.organization.is_approved && (
          <div className="flex items-start gap-3 bg-orange-50/50 border border-[#E85D26]/20 rounded-2xl px-5 py-4 text-[#1B2B6B] dark:bg-orange-950/10 dark:border-orange-500/20 dark:text-white">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="font-semibold text-[#1B2B6B] dark:text-white text-sm">{t.approvalBannerTitle}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{t.approvalBannerSub}</p>
            </div>
          </div>
        )}

        {/* Member request pending banner */}
        {pendingMembers.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 text-[#1B2B6B] dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-white text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{t.pendingRequestsBanner}</span>
            </div>
            <Link href="/members?tab=pending" className="text-[#E85D26] hover:text-[#D04E1A] dark:text-orange-400 dark:hover:text-orange-350 underline text-xs font-bold font-mono">
              {t.reviewRequests}
            </Link>
          </div>
        )}

        {/* Current meeting not created */}
        {!currentMeeting && (
          <div className="flex items-center justify-between bg-orange-50/50 border border-[#E85D26]/20 rounded-2xl px-5 py-3.5 text-[#1B2B6B] dark:bg-orange-950/10 dark:border-orange-500/20 dark:text-white text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{t.noMeetingRecordedBanner}</span>
            </div>
            <Link href="/meetings" className="text-[#E85D26] hover:text-[#D04E1A] dark:text-orange-400 dark:hover:text-orange-350 underline text-xs font-bold font-mono">
              {t.createMeeting}
            </Link>
          </div>
        )}

        {/* Current meeting is DRAFT */}
        {currentMeeting && currentMeeting.status === 'DRAFT' && (
          <div className="flex items-center justify-between bg-orange-50/50 border border-[#E85D26]/20 rounded-2xl px-5 py-3.5 text-[#1B2B6B] dark:bg-orange-950/10 dark:border-orange-500/20 dark:text-white text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>{t.meetingNotFinalizedBanner}</span>
            </div>
            <Link href={`/meetings/${currentMeeting.id}`} className="text-[#E85D26] hover:text-[#D04E1A] dark:text-orange-400 dark:hover:text-orange-350 underline text-xs font-bold font-mono">
              {t.enterDataFinalize}
            </Link>
          </div>
        )}

        {/* Loans approval pending */}
        {pendingLoanCount > 0 && performer.role === 'SUPERADMIN' && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 text-[#1B2B6B] dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-white text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>{t.loansAwaitingBanner}</span>
            </div>
            <Link href="/loans?tab=pending" className="text-[#E85D26] hover:text-[#D04E1A] dark:text-orange-400 dark:hover:text-orange-350 underline text-xs font-bold font-mono">
              {t.approveLoans}
            </Link>
          </div>
        )}
      </div>

      {/* Welcome Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-black text-[#1B2B6B] dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${roleBadge[performer.role]?.className}`}>
            {lang === 'mr' ? roleBadge[performer.role]?.labelMr : roleBadge[performer.role]?.labelEn}
          </span>
          <GroupCodeBadge code={performer.organization.group_code} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1 — Active Members */}
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800
                        p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between 
                          mb-2 md:mb-3 text-gray-400 dark:text-gray-500">
            <span className="text-[10px] md:text-xs font-bold 
                             uppercase tracking-wider leading-tight">
              {t.activeMembersLabel}
            </span>
            <span className="text-lg md:text-2xl">👥</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-[#1B2B6B] dark:text-white">
            {activeMembers.length}
          </p>
        </div>

        {/* Card 2 — Total Corpus */}
        <div className="bg-[#1B2B6B] border border-[#1B2B6B] dark:bg-[#0D1021] dark:border-gray-800
                        p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between 
                          mb-2 md:mb-3 text-orange-400">
            <div>
              <span className="text-[10px] md:text-xs font-bold 
                               uppercase tracking-wider text-white/70">
                {t.totalCorpusLabel}
              </span>
            </div>
            <span className="text-lg md:text-2xl text-white">🏦</span>
          </div>
          <p className="text-lg md:text-2xl font-black text-white 
                        leading-tight break-all">
            {formatRupees(totalCorpus)}
          </p>
        </div>

        {/* Card 3 — Outstanding Loans */}
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800
                        p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between 
                          mb-2 md:mb-3 text-gray-400 dark:text-gray-500">
            <span className="text-[10px] md:text-xs font-bold 
                             uppercase tracking-wider leading-tight">
              {t.outstandingLoansLabel}
            </span>
            <span className="text-lg md:text-2xl">💰</span>
          </div>
          <p className="text-lg md:text-2xl font-black text-[#1B2B6B] dark:text-white
                        leading-tight break-all">
            {formatRupees(totalOutstanding)}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
            {activeLoans.length} {t.activeCountText}
          </span>
        </div>

        {/* Card 4 — Pending Requests */}
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800
                        p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between 
                          mb-2 md:mb-3 text-gray-400 dark:text-gray-500">
            <span className="text-[10px] md:text-xs font-bold 
                             uppercase tracking-wider leading-tight">
              {t.pendingRequestsLabel}
            </span>
            <span className="text-lg md:text-2xl">🛡️</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-[#1B2B6B] dark:text-white">
            {pendingLoanCount + pendingMembers.length}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block font-mono">
            {pendingMembers.length}{t.membersInitial} | {pendingLoanCount}{t.loansInitial}
          </span>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Meetings List & Overdue */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Meetings */}
          <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800">
              <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">{t.recentMeetingsTitle}</h2>
              <Link href="/meetings" className="text-xs font-bold text-[#E85D26] dark:text-orange-400 hover:underline">
                {t.viewAllMeetings}
              </Link>
            </div>

            {recentMeetings.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-xs italic py-6 text-center">{t.noMeetingsRecorded}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-2.5">{t.monthCol}</th>
                      <th className="px-4 py-2.5">{t.statusCol}</th>
                      <th className="px-4 py-2.5">{t.totalCollectedCol}</th>
                      <th className="px-4 py-2.5">{t.closingBalanceCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {recentMeetings.map(m => (
                      <tr key={m.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10">
                        <td className="px-4 py-3 font-bold text-[#1B2B6B] dark:text-white">{formatMonthYear(m.month_year)}</td>
                        <td className="px-4 py-3">
                          {m.status === 'DRAFT' ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-[#E85D26] dark:bg-orange-950/30 dark:text-orange-400">{t.draftStatus}</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">{t.finalizedStatus}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">+{formatRupees(m.total_collected)}</td>
                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{formatRupees(m.closing_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overdue Loans list */}
          {overdueLoansList.length > 0 && (
            <div className="bg-red-50/30 border border-red-100 dark:bg-red-950/10 dark:border-red-900/30 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-red-800 dark:text-red-400">{t.overdueAccountsTitle}</h2>
              
              <div className="space-y-2">
                {overdueLoansList.map(l => (
                  <div key={l.id} className="flex justify-between items-center p-3 border border-red-100/50 bg-white dark:border-red-900/20 dark:bg-gray-950 rounded-2xl text-xs font-semibold">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{l.member?.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Amount: {formatRupees(l.loan_amount)} | Term: {l.term_months}m
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 dark:text-red-400 font-bold">{l.overdue_count} {t.emiUnpaid}</div>
                      <div className="text-[10px] text-red-500 dark:text-red-400/80 font-medium">{l.days_overdue} {t.daysOverdue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">{t.quickActionsTitle}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/meetings"
                className="bg-orange-50/50 hover:bg-orange-100/50 text-[#E85D26] border border-orange-100 dark:bg-orange-950/10 dark:hover:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30 rounded-2xl p-4 text-center text-xs font-bold transition active:scale-95 flex flex-col items-center gap-1.5"
              >
                <span>📅</span>
                <span>{t.newMeetingAction}</span>
              </Link>
              
              <Link
                href="/members"
                className="bg-blue-50/50 hover:bg-blue-100/50 text-[#2E4099] border border-blue-100 dark:bg-blue-950/10 dark:hover:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30 rounded-2xl p-4 text-center text-xs font-bold transition active:scale-95 flex flex-col items-center gap-1.5"
              >
                <span>👤</span>
                <span>{t.addMemberAction}</span>
              </Link>

              <Link
                href="/loans"
                className="bg-purple-50/50 hover:bg-purple-100/50 text-purple-700 border border-purple-100 dark:bg-purple-950/10 dark:hover:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30 rounded-2xl p-4 text-center text-xs font-bold transition active:scale-95 flex flex-col items-center gap-1.5"
              >
                <span>💰</span>
                <span>{t.viewLoansAction}</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column - Activity Logs */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">{t.recentActivityTitle}</h2>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{t.logsSub}</p>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {logsList.map((log) => (
                <div key={log.id} className="flex gap-3 items-start text-xs border-b border-gray-50 dark:border-gray-800 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1B2B6B]/10 text-[#1B2B6B] dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    {log.action.includes('MEMBER') ? '👤' :
                     log.action.includes('MEETING') ? '📅' :
                     log.action.includes('LOAN') ? '💰' :
                     log.action.includes('KYC') ? '📋' : '⚙️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 leading-snug break-words">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    {(() => {
                      const details = log.details as Record<string, any> | null
                      if (!details) return null
                      const displayVal = details.name || details.reason || details.notes
                      if (!displayVal) return null
                      return (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 italic">
                          {String(displayVal)}
                        </p>
                      )
                    })()}
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-1">
                      {new Date(log.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {logsList.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">{t.noActivity}</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
