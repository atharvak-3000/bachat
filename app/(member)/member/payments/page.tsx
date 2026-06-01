"use client"

import { useState, useEffect } from "react"
import { uploadPaymentProof, validateFile } from "@/lib/storage"
import { formatRupees, toP } from "@/lib/calculations"
import { getTranslation } from "@/lib/translations"

export default function MemberPaymentsPage() {
  const [member, setMember] = useState<any>(null)
  const [meetings, setMeetings] = useState<any[]>([])
  const [proofs, setProofs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [upiRef, setUpiRef] = useState("")
  const [meetingId, setMeetingId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
      const [memberRes, meetingsRes] = await Promise.all([
        fetch("/api/members/self"),
        fetch("/api/meetings")
      ])

      if (memberRes.ok) {
        const data = await memberRes.json()
        setMember(data.member)
      }
      
      if (meetingsRes.ok) {
        const data = await meetingsRes.json()
        setMeetings(data.meetings || [])
      }

      const selfProofsRes = await fetch("/api/payment-proofs/self")
      if (selfProofsRes.ok) {
        const data = await selfProofsRes.json()
        setProofs(data.proofs || [])
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !amount || !member) return

    const validationError = validateFile(file, { maxMB: 5, types: ['image/jpeg', 'image/png'] })
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const url = await uploadPaymentProof(file, member.id)
      
      const res = await fetch("/api/payment-proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: toP(amount),
          upi_reference: upiRef,
          meeting_id: meetingId || null,
          screenshot_url: url
        })
      })

      if (!res.ok) throw new Error("Failed to submit proof")

      setShowForm(false)
      setAmount("")
      setUpiRef("")
      setMeetingId("")
      setFile(null)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 animate-pulse text-gray-500 dark:text-gray-400">{t("loading")}</div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-850">
        <h1 className="text-[#1B2B6B] dark:text-white font-bold text-2xl">{t("paymentProofs")}</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#E85D26] hover:bg-[#D04E1A] text-white rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2 transition active:scale-95"
        >
          <span>+</span> {t("submitProof")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1A1D27] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold mb-4 text-lg text-[#1B2B6B] dark:text-white">{t("newProof")}</h2>
          {error && <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm font-medium">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("amount")} (₹) *</label>
              <input 
                type="number" 
                required 
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-[#1B2B6B]/25 focus:border-[#1B2B6B] outline-none transition text-sm" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("upiReference")}</label>
              <input 
                type="text" 
                value={upiRef}
                onChange={e => setUpiRef(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-[#1B2B6B]/25 focus:border-[#1B2B6B] outline-none transition text-sm" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("forMeeting")}</label>
              <select 
                value={meetingId}
                onChange={e => setMeetingId(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl p-2.5 focus:ring-2 focus:ring-[#1B2B6B]/25 focus:border-[#1B2B6B] outline-none transition text-sm"
              >
                <option value="">{t("selectMeeting")}</option>
                {meetings.map(m => (
                  <option key={m.id} value={m.id}>{m.month_year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("screenshot")} * (JPG/PNG)</label>
              <input 
                type="file" 
                required
                accept="image/jpeg,image/png"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-2 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1B2B6B] dark:file:bg-blue-600 file:text-white hover:file:bg-[#2E4099] file:cursor-pointer" 
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-[#E85D26] hover:bg-[#D04E1A] text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 transition text-sm"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-150 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <h2 className="text-[#1B2B6B] dark:text-white font-semibold text-base p-5 border-b border-gray-100 dark:border-gray-800">{t("myPaymentHistory")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wide border-b border-gray-100 dark:border-gray-850">
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3 text-right">{t("amount")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("month")}</th>
                <th className="px-4 py-3">{t("details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {proofs.map(p => (
                <tr key={p.id} className="bg-white dark:bg-[#1A1D27] hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition border-b border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(p.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-4 font-bold text-[#1B2B6B] dark:text-white text-right">
                    {formatRupees(p.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === 'VERIFIED' ? 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400' :
                      p.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {p.status === 'VERIFIED' ? t("verified") : p.status === 'REJECTED' ? t("rejected") : t("pending")}
                    </span>
                    {p.status === 'REJECTED' && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-semibold">{p.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-semibold">
                    {p.meeting?.month_year || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-[#E85D26] hover:text-[#D04E1A] hover:underline text-xs font-bold">
                      {t("viewScreenshot")}
                    </a>
                  </td>
                </tr>
              ))}
              {proofs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-gray-400 dark:text-gray-500 text-sm italic text-center py-10 bg-white dark:bg-[#1A1D27]">
                    {t("noPaymentProofs")}
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
