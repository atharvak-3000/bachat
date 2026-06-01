"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function AdminPaymentsClient({ proofs }: { proofs: any[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING')
  const [loading, setLoading] = useState(false)

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
      title: "पेमेंट पुरावे",
      tabPending: "प्रलंबित",
      tabVerified: "मंजूर केलेले",
      tabRejected: "नाकारलेले",
      dateCol: "तारीख",
      memberCol: "सदस्य",
      amountCol: "रक्कम",
      upiCol: "UPI संदर्भ / स्क्रीनशॉट",
      meetingCol: "सभा",
      actionsCol: "कृती",
      reasonCol: "कारण",
      verifyConfirm: "आपण नक्की या पेमेंटची पडताळणी करू इच्छिता?",
      rejectPrompt: "नाकारण्याचे कारण प्रविष्ट करा:",
      viewScreenshot: "स्क्रीनशॉट पहा",
      verifyBtn: "पडताळणी करा",
      rejectBtn: "नाकारा",
      noProofsText: "कोणतेही पेमेंट पुरावे आढळले नाहीत.",
    },
    en: {
      title: "Payment Proofs",
      tabPending: "Pending",
      tabVerified: "Verified",
      tabRejected: "Rejected",
      dateCol: "Date",
      memberCol: "Member",
      amountCol: "Amount",
      upiCol: "UPI Ref / Screenshot",
      meetingCol: "Meeting",
      actionsCol: "Actions",
      reasonCol: "Reason",
      verifyConfirm: "Are you sure you want to verify this payment?",
      rejectPrompt: "Enter rejection reason:",
      viewScreenshot: "View Screenshot",
      verifyBtn: "Verify",
      rejectBtn: "Reject",
      noProofsText: "No payment proofs found.",
    }
  }
  const t = T[lang]

  const pendingProofs = proofs.filter(p => p.status === 'PENDING')
  const verifiedProofs = proofs.filter(p => p.status === 'VERIFIED')
  const rejectedProofs = proofs.filter(p => p.status === 'REJECTED')

  const currentProofs = tab === 'PENDING' ? pendingProofs : tab === 'VERIFIED' ? verifiedProofs : rejectedProofs

  const handleVerify = async (id: string) => {
    if (!confirm(t.verifyConfirm)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payment-proofs/${id}/verify`, { method: "POST" })
      if (!res.ok) throw new Error("Verification failed")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt(t.rejectPrompt)
    if (!reason) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payment-proofs/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      })
      if (!res.ok) throw new Error("Rejection failed")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.title}</h1>

      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setTab('PENDING')} 
          className={`pb-2 text-sm font-medium ${tab === 'PENDING' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.tabPending} ({pendingProofs.length})
        </button>
        <button 
          onClick={() => setTab('VERIFIED')} 
          className={`pb-2 text-sm font-medium ${tab === 'VERIFIED' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.tabVerified} ({verifiedProofs.length})
        </button>
        <button 
          onClick={() => setTab('REJECTED')} 
          className={`pb-2 text-sm font-medium ${tab === 'REJECTED' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.tabRejected} ({rejectedProofs.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">{t.dateCol}</th>
                <th className="px-6 py-3 font-medium">{t.memberCol}</th>
                <th className="px-6 py-3 font-medium">{t.amountCol}</th>
                <th className="px-6 py-3 font-medium">{t.upiCol}</th>
                <th className="px-6 py-3 font-medium">{t.meetingCol}</th>
                {tab === 'PENDING' && <th className="px-6 py-3 font-medium">{t.actionsCol}</th>}
                {tab === 'REJECTED' && <th className="px-6 py-3 font-medium">{t.reasonCol}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentProofs.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {p.member?.name} <span className="text-gray-400 text-xs">#{p.member?.member_number}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatRupees(p.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600 text-xs">Ref: {p.upi_reference || '-'}</span>
                      <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-xs font-semibold">
                        {t.viewScreenshot}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {p.meeting?.month_year || '-'}
                  </td>
                  {tab === 'PENDING' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVerify(p.id)}
                          disabled={loading}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          {t.verifyBtn}
                        </button>
                        <button 
                          onClick={() => handleReject(p.id)}
                          disabled={loading}
                          className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          {t.rejectBtn}
                        </button>
                      </div>
                    </td>
                  )}
                  {tab === 'REJECTED' && (
                    <td className="px-6 py-4 text-red-600 text-xs max-w-[200px] truncate" title={p.rejection_reason}>
                      {p.rejection_reason}
                    </td>
                  )}
                </tr>
              ))}
              {currentProofs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    {t.noProofsText}
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
