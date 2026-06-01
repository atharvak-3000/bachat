import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { calcMemberStats, formatRupees, formatMonthYear } from "@/lib/calculations"
import type { MeetingContribution, Meeting, Loan, LoanEmi, Member } from "@/types"
import { cookies } from "next/headers"
import { getTranslation } from "@/lib/translations"

export default async function MemberPage() {
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

  // Fetch Member contributions
  const { data: contribs, error: contribsError } = await supabase
    .from("meeting_contributions")
    .select("*, meeting:meetings(*)")
    .eq("member_id", performer.id)

  if (contribsError) console.error(contribsError)

  // Fetch Member loans
  const { data: loans, error: loansError } = await supabase
    .from("loans")
    .select("*")
    .eq("member_id", performer.id)

  if (loansError) console.error(loansError)

  const memberContribs = (contribs || []) as (MeetingContribution & { meeting: Meeting })[]
  const memberLoans = (loans || []) as Loan[]

  // Compute personal stats
  const stats = calcMemberStats(
    memberContribs.map(c => ({
      savings_amount: c.savings_amount,
      interest_paid: c.interest_paid,
      is_present: c.is_present
    })),
    memberLoans.map(l => ({
      outstanding_amount: l.outstanding_amount,
      status: l.status
    }))
  )

  // Find active loan details (if any)
  const activeLoan = memberLoans.find(l => l.status === 'ACTIVE')
  let nextEmi: LoanEmi | null = null
  let overdueEmiCount = 0
  let emiProgressPercent = 0

  if (activeLoan) {
    const { data: emis } = await supabase
      .from("loan_emis")
      .select("*")
      .eq("loan_id", activeLoan.id)
      .order("month_year", { ascending: true })

    const loanEmis = (emis || []) as LoanEmi[]
    const todayStr = new Date().toISOString().split('T')[0]

    // Find next pending EMI
    nextEmi = loanEmis.find(e => e.status !== 'PAID') || null
    
    // Count overdue
    overdueEmiCount = loanEmis.filter(e => 
      e.status === 'OVERDUE' || (e.status !== 'PAID' && e.due_date < todayStr)
    ).length

    // Repaid percentage
    emiProgressPercent = Math.min(
      100,
      Math.round(((activeLoan.loan_amount - activeLoan.outstanding_amount) / activeLoan.loan_amount) * 100)
    )
  }

  // Fetch transparency org-wide stats
  // First get all member IDs of this organization
  const { data: orgMembers } = await supabase
    .from("members")
    .select("id")
    .eq("organization_id", performer.organization_id)

  const memberIds = (orgMembers || []).map(m => m.id)

  let orgSavings = 0
  let orgInterest = 0
  let orgFines = 0

  if (memberIds.length > 0) {
    const { data: orgContribs } = await supabase
      .from("meeting_contributions")
      .select("savings_amount, interest_paid, penalty_paid")
      .in("member_id", memberIds)

    const cList = orgContribs || []
    orgSavings = cList.reduce((sum, c) => sum + (c.savings_amount || 0), 0)
    orgInterest = cList.reduce((sum, c) => sum + (c.interest_paid || 0), 0)
    orgFines = cList.reduce((sum, c) => sum + (c.penalty_paid || 0), 0)
  }

  const { data: activeOrgLoans } = await supabase
    .from("loans")
    .select("outstanding_amount")
    .eq("organization_id", performer.organization_id)
    .eq("status", "ACTIVE")

  const orgLoansOut = (activeOrgLoans || []).reduce((sum, l) => sum + (l.outstanding_amount || 0), 0)

  // Sort contributions history (last 12)
  const sortedContributions = [...memberContribs]
    .sort((a, b) => new Date(b.meeting.meeting_date).getTime() - new Date(a.meeting.meeting_date).getTime())
    .slice(0, 12)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] rounded-2xl p-6 text-white shadow-lg space-y-6">
        <div>
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{t("welcome")}</span>
          <h1 className="text-3xl font-bold mt-1">{performer.name} 👋</h1>
          <p className="text-blue-200 text-sm mt-1">{performer.organization.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 text-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide">{t("memberNo")}</p>
            <p className="text-white font-bold text-xl mt-1">#{performer.member_number}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 text-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide">{t("groupCode")}</p>
            <p className="text-white font-bold text-xl mt-1 font-mono">{performer.organization.group_code}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 text-center flex flex-col justify-center items-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">{t("kyc")}</p>
            {performer.kyc_status === 'VERIFIED' ? (
              <span className="text-green-300 font-semibold">{t("verified")}</span>
            ) : performer.kyc_status === 'REJECTED' ? (
              <span className="text-red-300 font-semibold">{t("rejected")}</span>
            ) : (
              <span className="text-[#E85D26] font-semibold">{t("pending")}</span>
            )}
          </div>
        </div>
      </div>

      {/* KYC Warning/Status Card */}
      {performer.kyc_status !== 'VERIFIED' && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-[#E85D26] rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl text-[#E85D26]">⚠️</span>
          <div>
            <p className="text-[#1B2B6B] dark:text-white font-semibold">
              {performer.kyc_status === 'REJECTED' ? t("kycNotApproved") : t("completeKyc")}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {performer.kyc_status === 'REJECTED' 
                ? t("kycNotApprovedDesc") 
                : t("completeKycDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Personal Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
          <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wide block">
            {t("mySavings")}
          </span>
          <h4 className="text-2xl font-bold text-[#1B2B6B] dark:text-white mt-1.5 md:mt-2 break-all">{formatRupees(stats.total_savings)}</h4>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
          <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wide block">
            {t("activeLoanDue")}
          </span>
          <h4 className="text-2xl font-bold text-[#E85D26] dark:text-orange-400 mt-1.5 md:mt-2 break-all">{formatRupees(stats.outstanding_loan)}</h4>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
          <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wide block">
            {t("interestPaid")}
          </span>
          <h4 className="text-2xl font-bold text-[#E85D26] dark:text-orange-400 mt-1.5 md:mt-2 break-all">{formatRupees(stats.total_interest_paid)}</h4>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
          <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wide block">
            {t("attendance")}
          </span>
          <h4 className="text-2xl font-bold text-[#2E4099] dark:text-blue-400 mt-1.5 md:mt-2">{stats.attendance_percent}%</h4>
          <span className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 block">{stats.meetings_attended} / {stats.total_meetings} {t("meetings")}</span>
        </div>
      </div>

      {/* Active Loan & EMI Details */}
      {activeLoan && (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">{t("activeLoanRepayment")}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{t("disbursedOn")} {new Date(activeLoan.disbursed_date).toLocaleDateString('en-IN')}</p>
            </div>
            {overdueEmiCount > 0 && (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 animate-pulse">
                ⚠️ {overdueEmiCount} {t("overdueEmi")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Progress */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span>{t("repaymentProgress")}</span>
                  <span className="text-[#E85D26] dark:text-orange-400">{emiProgressPercent}% {t("paid")}</span>
                </div>
                <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1B2B6B] dark:bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${emiProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-semibold">
                  <span>{t("repaid")}: {formatRupees(activeLoan.loan_amount - activeLoan.outstanding_amount)}</span>
                  <span>{t("remainingOutstanding")}: {formatRupees(activeLoan.outstanding_amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/50 dark:bg-gray-950/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 dark:text-gray-500">{t("totalSanctionedLoan")}</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{formatRupees(activeLoan.loan_amount)}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500">{t("monthlyInterestRate")}</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{activeLoan.interest_rate}% p.a.</p>
                </div>
              </div>
            </div>

            {/* Next EMI summary */}
            {nextEmi && (
              <div className="bg-[#E85D26]/5 dark:bg-[#E85D26]/5 border border-[#E85D26]/20 dark:border-orange-950/30 p-5 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-[#E85D26] dark:text-orange-400 uppercase tracking-wider">{t("nextEmiDue")}</span>
                
                <div className="space-y-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>{t("month")}</span>
                    <strong className="text-gray-900 dark:text-white">{nextEmi.month_year}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("principal")}</span>
                    <strong className="text-gray-800 dark:text-white">{formatRupees(nextEmi.principal_due - nextEmi.principal_paid)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("interest")}</span>
                    <strong className="text-gray-800 dark:text-white">{formatRupees(nextEmi.interest_due - nextEmi.interest_paid)}</strong>
                  </div>
                  
                  <hr className="border-[#E85D26]/20 dark:border-orange-950/20" />
                  
                  <div className="flex justify-between text-sm font-extrabold text-[#E85D26] dark:text-orange-400">
                    <span>{t("totalDue")}</span>
                    <span>{formatRupees((nextEmi.principal_due - nextEmi.principal_paid) + (nextEmi.interest_due - nextEmi.interest_paid))}</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center">
                  {t("dueOn")}: {new Date(nextEmi.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Grid: Contributions History & Transparency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contributions table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white border-b border-gray-50 dark:border-gray-800 pb-3">{t("mySavingsHistory")}</h2>
          
          {sortedContributions.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-xs italic py-6 text-center">{t("noContributions")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1B2B6B] dark:bg-gray-950 text-white text-xs font-semibold uppercase tracking-wide">
                    <th className="px-3 py-3">{t("month")}</th>
                    <th className="px-3 py-3 text-center">{t("present")}</th>
                    <th className="px-3 py-3">{t("savings")}</th>
                    <th className="px-3 py-3">{t("repaid")}</th>
                    <th className="px-3 py-3">{t("interest")}</th>
                    <th className="px-3 py-3">{t("penalty")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                  {sortedContributions.map((c, idx) => (
                    <tr key={c.id} className="odd:bg-white odd:dark:bg-[#1A1D27] even:bg-gray-50 even:dark:bg-gray-950/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition-colors border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">{formatMonthYear(c.meeting.month_year)}</td>
                      <td className="px-3 py-3 text-center">
                        {c.is_present ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓ {t("present")}</span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400 font-semibold">✗ {t("absent")}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{formatRupees(c.savings_amount)}</td>
                      <td className="px-3 py-3">{formatRupees(c.loan_repayment)}</td>
                      <td className="px-3 py-3 text-[#E85D26] dark:text-orange-400">{formatRupees(c.interest_paid)}</td>
                      <td className="px-3 py-3 text-red-500 dark:text-red-400 font-semibold">{formatRupees(c.penalty_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transparency Section */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-gray-50 dark:border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">📊 {t("gatTransparency")}</h2>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">{t("transparencyDesc")}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("totalGroupSavings")}</span>
              <strong className="text-sm font-bold text-gray-800 dark:text-white">{formatRupees(orgSavings)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("outstandingLoans")}</span>
              <strong className="text-sm font-bold text-gray-800 dark:text-white">{formatRupees(orgLoansOut)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("interestCollected")}</span>
              <strong className="text-sm font-bold text-[#E85D26] dark:text-orange-400">{formatRupees(orgInterest)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("finesCollected")}</span>
              <strong className="text-sm font-bold text-red-500 dark:text-red-400">{formatRupees(orgFines)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Log Out */}
      <SignOutButton t={t} />
    </div>
  )
}

function SignOutButton({ t }: { t: any }) {
  return (
    <form action="/auth/signout" method="post">
      <button 
        type="submit"
        className="w-full py-3.5 border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 rounded-2xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition"
      >
        {t("signOut")}
      </button>
    </form>
  )
}
