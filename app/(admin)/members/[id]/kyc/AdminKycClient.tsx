"use client"

import { useState, useEffect } from "react"
import type { Member } from "@/types"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminKycClient({ member }: { member: Member }) {
  const router = useRouter()
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
      backBtn: "← सदस्य प्रोफाइलवर परत या",
      title: "केवायसी पडताळणी",
      verifyLabel: "सदस्य पडताळणी",
      memberNum: "सदस्य क्रमांक",
      statusVerified: "✓ पूर्ण",
      statusRejected: "✗ नाकारले",
      statusPending: "प्रलंबित",
      processTitle: "केवायसी कार्यपद्धती",
      step1: "सभासदाला सभेदरम्यान स्वतःचे मूळ कागदपत्रे आणण्यास सांगा.",
      step2: "पुढील कागदपत्रांची काळजीपूर्वक पडताळणी करा: आधार कार्ड, पॅन कार्ड, फोटो आणि स्वाक्षरी.",
      step3: "खालील चेकलिस्टमध्ये पडताळणी केलेल्या कागदपत्रांना खूण करा.",
      step4: "पडताळणी तपशील नोंदवा (उदा. \"शेवटी ५५४३ असलेले आधार पडताळले\") आणि स्थिती जतन करा.",
      checklistTitle: "कागदपत्रांची चेकलिस्ट",
      aadhaarLabel: "आधार कार्ड",
      panLabel: "पॅन कार्ड",
      photoLabel: "फोटो",
      signatureLabel: "स्वाक्षरी",
      actionTitle: "निर्णय",
      notesLabel: "पडताळणी नोंद",
      notesPlaceholder: "उदा. आधार: XXXX-XXXX-४३२१ जुळले. मंजूर.",
      approveBtn: "मंजूर करा",
      rejectBtn: "नाकारा",
      successAlert: "🎉 केवायसी यशस्वीरित्या पूर्ण झाली",
      successSub: "हा सदस्य पूर्णपणे पडताळला गेला आहे. पुढील कोणत्याही कृतीची आवश्यकता नाही.",
      reverifyBtn: "पुन्हा पडताळणी करा",
      rejectionPrompt: "कृपया नाकारण्याचे कारण प्रविष्ट करा (ऐच्छिक):",
      physicalVerifyPrompt: "तुम्ही या सदस्याच्या सर्व कागदपत्रांची प्रत्यक्ष पडताळणी केली आहे का?",
      incompletePrompt: "काही कागदपत्रे निवडलेली नसली तरीही तुम्ही या सदस्याला 'मंजूर' म्हणून चिन्हांकित करू इच्छिता?",
      updatedOn: "स्थिती अपडेट केल्याची तारीख",
    },
    en: {
      backBtn: "← Back to Member Profile",
      title: "KYC Verification",
      verifyLabel: "Verify member",
      memberNum: "Member #",
      statusVerified: "✓ Verified",
      statusRejected: "✗ Rejected",
      statusPending: "Pending",
      processTitle: "Manual Offline KYC Process",
      step1: "Ask member to bring their original physical documents in person during a meeting.",
      step2: "Thoroughly verify details on: Aadhaar card, PAN card, Photograph, and Signature.",
      step3: "Check off the verified items in the checklist below.",
      step4: "Input verification audit notes (e.g. \"Verified Aadhaar ending in 5543\") and save status.",
      checklistTitle: "Documents Checklist",
      aadhaarLabel: "Aadhaar Card",
      panLabel: "PAN Card",
      photoLabel: "Recent Photograph",
      signatureLabel: "Signature",
      actionTitle: "Action",
      notesLabel: "Verification Notes",
      notesPlaceholder: "e.g. Aadhaar: XXXX-XXXX-4321 matched perfectly. Approved.",
      approveBtn: "Mark Verified",
      rejectBtn: "Mark Rejected",
      successAlert: "🎉 KYC VERIFIED SUCCESSFULLY",
      successSub: "This member is fully verified. No further actions are needed.",
      reverifyBtn: "Re-verify",
      rejectionPrompt: "Please enter the reason for rejection (optional):",
      physicalVerifyPrompt: "Have you physically verified all documents for this member?",
      incompletePrompt: "Are you sure you want to mark this member as VERIFIED even though some document checklist items are unchecked?",
      updatedOn: "Status updated on",
    }
  }
  const t = T[lang]

  // Checklist items
  const [checklist, setChecklist] = useState({
    aadhaar: false,
    pan: false,
    photo: false,
    signature: false
  })

  const [notes, setNotes] = useState(member.kyc_notes || "")

  const handleUpdateStatus = async (status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    if (status === 'VERIFIED') {
      const allChecked = Object.values(checklist).every(Boolean)
      if (!allChecked) {
        if (!confirm(t.incompletePrompt)) {
          return
        }
      } else {
        if (!confirm(t.physicalVerifyPrompt)) {
          return
        }
      }
    }

    if (status === 'REJECTED') {
      const reason = prompt(t.rejectionPrompt)
      if (reason === null) return // cancel
      setNotes(prev => (prev ? `${prev}\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`))
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/members/${member.id}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: status === 'REJECTED' ? (notes ? `${notes}\nRejection reason: ...` : 'Rejected offline') : notes
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update KYC status")
      }

      router.refresh()
      // Force reload to get updated member object with verifier details
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle checklist
  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button */}
      <Link href={`/members/${member.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition font-medium">
        {t.backBtn}
      </Link>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t.title}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {t.verifyLabel}: <strong>{member.name}</strong> ({t.memberNum} {member.member_number})
          </p>
        </div>

        <div>
          {member.kyc_status === 'VERIFIED' ? (
            <span className="inline-flex px-4 py-2 rounded-2xl bg-green-50 text-green-700 font-bold text-sm border border-green-200">
              {t.statusVerified}
            </span>
          ) : member.kyc_status === 'REJECTED' ? (
            <span className="inline-flex px-4 py-2 rounded-2xl bg-red-50 text-red-700 font-bold text-sm border border-red-200">
              {t.statusRejected}
            </span>
          ) : (
            <span className="inline-flex px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 font-bold text-sm border border-amber-200">
              {t.statusPending}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Info details */}
      {member.kyc_verified_at && (
        <div className="bg-gray-50 border border-gray-150 p-5 rounded-3xl text-sm text-gray-600 space-y-2">
          <p>
            {t.updatedOn}: <strong>{new Date(member.kyc_verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </p>
          {member.kyc_notes && (
            <p>
              {t.notesLabel}: <code className="block bg-white border border-gray-100 rounded-xl p-3 text-xs mt-1 text-gray-700 whitespace-pre-wrap">{member.kyc_notes}</code>
            </p>
          )}
        </div>
      )}

      {/* How it works info card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 text-sm text-blue-800 space-y-3">
        <h3 className="font-bold text-base flex items-center gap-1.5">
          <span>📋</span>
          <span>{t.processTitle}</span>
        </h3>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-blue-700 font-medium">
          <li>{t.step1}</li>
          <li>{t.step2}</li>
          <li>{t.step3}</li>
          <li>{t.step4}</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Documents checklist */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">{t.checklistTitle}</h2>
          
          <div className="space-y-3">
            {[
              { id: "aadhaar", label: t.aadhaarLabel },
              { id: "pan", label: t.panLabel },
              { id: "photo", label: t.photoLabel },
              { id: "signature", label: t.signatureLabel }
            ].map(item => (
              <label 
                key={item.id} 
                className={`flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer transition select-none ${checklist[item.id as keyof typeof checklist] ? "border-green-300 bg-green-50/20 text-green-800" : "border-gray-100 bg-gray-50/10 text-gray-600 hover:bg-gray-50/50"}`}
              >
                <input
                  type="checkbox"
                  disabled={member.kyc_status === 'VERIFIED'}
                  checked={checklist[item.id as keyof typeof checklist]}
                  onChange={() => toggleCheck(item.id as keyof typeof checklist)}
                  className="w-4.5 h-4.5 accent-green-600 rounded"
                />
                <span className="text-xs font-bold">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Verification action panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">{t.actionTitle}</h2>

          {member.kyc_status !== 'VERIFIED' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.notesLabel}
                </label>
                <textarea
                  placeholder={t.notesPlaceholder}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateStatus('VERIFIED')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold p-3.5 rounded-xl text-center text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {t.approveBtn}
                </button>

                {member.kyc_status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold p-3.5 rounded-xl text-center text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {t.rejectBtn}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-xs font-bold text-center">
                {t.successAlert}
              </div>
              <p className="text-gray-500 text-xs text-center font-medium">
                {t.successSub}
              </p>
            </div>
          )}

          {member.kyc_status === 'REJECTED' && (
            <button
              onClick={() => handleUpdateStatus('PENDING')}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold p-3 rounded-xl text-center text-xs transition"
            >
              {t.reverifyBtn}
            </button>
          )}
        </div>

      </div>

    </div>
  )
}
