"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Step1Data = {
  name: string
  village: string
  taluka: string
  district: string
  meeting_frequency: 'WEEKLY' | 'MONTHLY'
}

type Step2Data = {
  monthly_saving_amount: string
  default_interest_rate: string
  default_penalty_amount: string
  max_loan_limit: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const [step1, setStep1] = useState<Step1Data>({
    name: '',
    village: '',
    taluka: '',
    district: '',
    meeting_frequency: 'MONTHLY',
  })

  const [step2, setStep2] = useState<Step2Data>({
    monthly_saving_amount: '',
    default_interest_rate: '2',
    default_penalty_amount: '0',
    max_loan_limit: '',
  })

  useEffect(() => {
    const checkExisting = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (member) {
        router.push(member.role === 'MEMBER' ? '/member' : '/dashboard')
      } else {
        setChecking(false)
      }
    }
    checkExisting()
  }, [router])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: step1.name,
          village: step1.village,
          taluka: step1.taluka,
          district: step1.district,
          meeting_frequency: step1.meeting_frequency,
          monthly_saving_amount: parseFloat(step2.monthly_saving_amount) || 0,
          default_interest_rate: parseFloat(step2.default_interest_rate) || 2,
          default_penalty_amount: parseFloat(step2.default_penalty_amount) || 0,
          max_loan_limit: parseFloat(step2.max_loan_limit) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create organization')
      toast.success(`बचत गट तयार झाला! Code: ${data.group_code}`)
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'काहीतरी चूक झाली')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8 border border-orange-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-600">🪷 BachatGatOnline</h1>
          <p className="text-sm text-gray-500 mt-1">तुमचा बचत गट तयार करा</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? 'bg-orange-600 text-white'
                  : step > s
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-orange-600' : 'text-gray-400'}`}>
                {s === 1 ? 'गटाची माहिती' : 'आर्थिक सेटिंग्ज'}
              </span>
              {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">तुमच्या बचत गटाची माहिती</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">गटाचे नाव *</label>
              <input type="text" required value={step1.name}
                onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                placeholder="उदा. जय भवानी महिला बचत गट" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">गाव / शहर *</label>
                <input type="text" required value={step1.village}
                  onChange={(e) => setStep1({ ...step1, village: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="उदा. पुणे" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">तालुका</label>
                <input type="text" value={step1.taluka}
                  onChange={(e) => setStep1({ ...step1, taluka: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="पर्यायी" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">जिल्हा *</label>
              <input type="text" required value={step1.district}
                onChange={(e) => setStep1({ ...step1, district: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                placeholder="उदा. पुणे" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">बैठकीची वारंवारता</label>
              <select value={step1.meeting_frequency}
                onChange={(e) => setStep1({ ...step1, meeting_frequency: e.target.value as 'WEEKLY' | 'MONTHLY' })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition bg-white">
                <option value="MONTHLY">मासिक (Monthly)</option>
                <option value="WEEKLY">साप्ताहिक (Weekly)</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (!step1.name || !step1.village || !step1.district) {
                  toast.error('कृपया आवश्यक फील्ड भरा')
                  return
                }
                setStep(2)
              }}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition">
              पुढे जा →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">आर्थिक सेटिंग्ज</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">मासिक बचत ₹ *</label>
                <input type="number" min="0" required value={step2.monthly_saving_amount}
                  onChange={(e) => setStep2({ ...step2, monthly_saving_amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">व्याज दर % / महिना</label>
                <input type="number" min="0" step="0.1" value={step2.default_interest_rate}
                  onChange={(e) => setStep2({ ...step2, default_interest_rate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">दंड रक्कम ₹</label>
                <input type="number" min="0" value={step2.default_penalty_amount}
                  onChange={(e) => setStep2({ ...step2, default_penalty_amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">कर्ज मर्यादा ₹</label>
                <input type="number" min="0" value={step2.max_loan_limit}
                  onChange={(e) => setStep2({ ...step2, max_loan_limit: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="0" />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 space-y-2">
              <p className="text-xs font-semibold text-orange-700 uppercase">सारांश / Summary</p>
              <p className="text-sm text-gray-700">📍 <strong>{step1.name}</strong> — {step1.village}, {step1.district}</p>
              <p className="text-sm text-gray-700">📅 {step1.meeting_frequency === 'MONTHLY' ? 'मासिक बैठक' : 'साप्ताहिक बैठक'}</p>
              <p className="text-sm text-gray-700">💰 बचत: ₹{step2.monthly_saving_amount || 0} | व्याज: {step2.default_interest_rate || 2}%</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                ← मागे जा
              </button>
              <button onClick={handleSubmit} disabled={loading || !step2.monthly_saving_amount}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  : 'गट तयार करा 🎉'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
