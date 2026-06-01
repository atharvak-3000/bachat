"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatRupees, formatMonthYear, toP } from "@/lib/calculations"
import Link from "next/link"

interface MeetingWithTotals {
  id: string
  meeting_date: string
  month_year: string
  status: 'DRAFT' | 'FINALIZED'
  opening_balance: number
  notes: string
  closing_date?: string
  totals: {
    total_savings: number
    total_penalty: number
    total_loan_repayment: number
    total_interest: number
    total_other_income: number
    total_receipts: number
    total_loans_issued: number
    total_other_expenses: number
    total_expenses: number
    closing_balance: number
  }
}

export default function MeetingsClient({ initialMeetings }: { initialMeetings: MeetingWithTotals[] }) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<MeetingWithTotals[]>(initialMeetings)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    opening_balance: ""
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
      title: "सभा",
      sub: "तुमच्या मासिक बचत गट सभा व्यवस्थापित करा, बचत, दंड, कर्ज आणि इतर आर्थिक नोंदी करा.",
      newMeeting: "नवीन सभा",
      createFirstMeeting: "पहिली सभा तयार करा →",
      noMeetings: "अद्याप कोणतीही सभा नाही",
      noMeetingsSub: "तुमच्या बचत गटासाठी बचत आणि कर्ज ट्रॅक करणे सुरू करण्यासाठी तुमची पहिली मासिक सभा तयार करा.",
      statusFinalized: "पूर्ण",
      statusDraft: "अपूर्ण",
      openingBal: "मागील शिल्लक",
      totalCollected: "एकूण जमा",
      closingBal: "आजची शिल्लक",
      totalReceipts: "एकूण जमा",
      closingDate: "बंद तारीख",
      actions: "कृती",
      enterData: "नोंदणी करा",
      view: "पहा",
      createMeetingTitle: "नवीन सभा तयार करा",
      meetingDateLabel: "सभेची तारीख",
      openingBalanceLabel: "मागील शिल्लक (₹)",
      amountPlaceholder: "₹ मध्ये रक्कम प्रविष्ट करा (उदा. ५०००)",
      cancel: "रद्द करा",
      creating: "तयार करत आहे...",
      createBtn: "सभा तयार करा",
      notSet: "निश्चित नाही",
      statusCol: "स्थिती",
    },
    en: {
      title: "Meetings",
      sub: "Manage your monthly bachat gat meetings, record savings, penalties, loans, and other financial entries.",
      newMeeting: "New Meeting",
      createFirstMeeting: "Create first meeting →",
      noMeetings: "No meetings yet",
      noMeetingsSub: "Create your first monthly meeting to start tracking savings and loans for your Bachat Gat.",
      statusFinalized: "Finalized",
      statusDraft: "Draft",
      openingBal: "Opening Bal",
      totalCollected: "Total Collected",
      closingBal: "Closing Bal",
      totalReceipts: "Total Receipts",
      closingDate: "Closing Date",
      actions: "Actions",
      enterData: "Enter Data",
      view: "View",
      createMeetingTitle: "Create New Meeting",
      meetingDateLabel: "Meeting Date",
      openingBalanceLabel: "Opening Balance (₹)",
      amountPlaceholder: "Enter amount in ₹ (e.g. 5000)",
      cancel: "Cancel",
      creating: "Creating...",
      createBtn: "Create Meeting",
      notSet: "Not set",
      statusCol: "Status",
    }
  }
  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Convert opening balance to paise
    const balRupees = parseFloat(formData.opening_balance) || 0
    const balPaise = toP(balRupees)

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_date: formData.meeting_date,
          opening_balance: balPaise
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create meeting")
      }

      const newMeeting = await res.json()
      const meetingId = newMeeting.id || newMeeting.meeting?.id

      if (meetingId) {
        router.push(`/meetings/${meetingId}`)
      } else {
        router.refresh()
        setIsModalOpen(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B2B6B] dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
            {t.sub}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#E85D26] text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-[#D04E1A] hover:shadow-lg active:scale-95 transition-all duration-200 text-sm md:text-base"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t.newMeeting}
        </button>
      </div>

      {/* Meetings Table or Empty State */}
      {meetings.length === 0 ? (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#E85D26]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#E85D26]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.noMeetings}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto text-sm">
            {t.noMeetingsSub}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#E85D26] hover:text-[#D04E1A] dark:text-orange-400 dark:hover:text-orange-350 hover:underline"
          >
            {t.createFirstMeeting}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3 p-4 bg-gray-50/50 dark:bg-gray-950/20">
            {meetings.map(m => (
              <div key={m.id}
                   className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-gray-800 
                              p-4 shadow-sm">
                
                {/* Status + Date */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {new Date(m.meeting_date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t.openingBal}: {formatRupees(m.opening_balance)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    m.status === 'FINALIZED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {m.status === 'FINALIZED' ? t.statusFinalized : t.statusDraft}
                  </span>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-2.5">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {t.totalCollected}
                    </p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      {formatRupees(m.totals?.total_receipts || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {t.closingBal}
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {formatRupees(m.totals?.closing_balance || 0)}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href={`/meetings/${m.id}`}
                  className={`block w-full text-center py-2 rounded-xl 
                              text-sm font-semibold transition ${
                    m.status === 'FINALIZED'
                      ? 'border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 bg-white dark:bg-gray-950'
                      : 'bg-[#E85D26] text-white hover:bg-[#D04E1A]'
                  }`}>
                  {m.status === 'FINALIZED' ? t.view : t.enterData}
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold text-sm border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4">{t.meetingDateLabel}</th>
                  <th className="px-6 py-4">{t.statusCol}</th>
                  <th className="px-6 py-4">{t.openingBal}</th>
                  <th className="px-6 py-4">{t.totalReceipts}</th>
                  <th className="px-6 py-4">{t.closingBal}</th>
                  <th className="px-6 py-4">{t.closingDate}</th>
                  <th className="px-6 py-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition-colors duration-150">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {new Date(m.meeting_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long', 
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {m.status === 'DRAFT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {t.statusDraft}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {t.statusFinalized}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {formatRupees(m.opening_balance)}
                    </td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-semibold">
                      +{formatRupees(m.totals.total_receipts)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {formatRupees(m.totals.closing_balance)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {m.closing_date 
                        ? new Date(m.closing_date).toLocaleDateString('en-IN')
                        : m.status === 'DRAFT' ? '—' : t.notSet
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'DRAFT' ? (
                        <Link
                          href={`/meetings/${m.id}`}
                          className="inline-flex items-center gap-1 bg-[#E85D26] text-white font-semibold px-4 py-1.5 rounded-xl hover:bg-[#D04E1A] active:scale-95 transition-all text-xs"
                        >
                          {t.enterData}
                        </Link>
                      ) : (
                        <Link
                          href={`/meetings/${m.id}`}
                          className="inline-flex items-center gap-1 border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 font-semibold px-4 py-1.5 rounded-xl active:scale-95 transition-all text-xs bg-white dark:bg-gray-950"
                        >
                          {t.view}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-[#1B2B6B] dark:text-white">{t.createMeetingTitle}</h2>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.meetingDateLabel}
                </label>
                <input
                  type="date"
                  required
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:border-[#E85D26] focus:ring-1 focus:ring-[#E85D26] outline-none transition dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.openingBalanceLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder={t.amountPlaceholder}
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:border-[#E85D26] focus:ring-1 focus:ring-[#E85D26] outline-none transition dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold p-3 rounded-xl transition text-sm text-center"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#E85D26] hover:bg-[#D04E1A] text-white font-semibold p-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {loading ? t.creating : t.createBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
