"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  User, 
  Type, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Calendar, 
  Info, 
  AlertCircle, 
  X, 
  UserPlus 
} from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (creds: { name: string; phone: string; password: string }) => void
}

export default function AddMemberForm({ isOpen, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [limitError, setLimitError] = useState<{
    error: string
    message: string
    currentPlan: string
    maxMembers: number
  } | null>(null)
  const [form, setForm] = useState({
    name: "",
    name_marathi: "",
    phone: "",
    password: "",
    address: "",
    joining_date: new Date().toISOString().split("T")[0],
  })

  // Inline validation error states
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    password: "",
  })

  const [lang, setLang] = useState<'mr' | 'en'>('mr')

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_lang") as 'mr' | 'en'
      if (stored === 'mr' || stored === 'en') {
        setLang(stored)
      }
    }
    setLimitError(null)
  }, [isOpen])

  const T = {
    mr: {
      title: "सदस्य जोडा",
      tipTitle: "टीप:",
      tipDesc: "येथे जोडलेले सदस्य स्वयं-मंजूर आहेत.",
      fullNameLabel: "पूर्ण नाव",
      fullNamePlaceholder: "पूर्ण नाव टाका",
      nameMarathiLabel: "नाव मराठी",
      nameMarathiPlaceholder: "मराठी नाव टाका (पर्यायी)",
      phoneLabel: "फोन",
      phonePlaceholder: "१० अंकी मोबाईल नंबर",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "किमान ६ अक्षरे",
      credTitle: "लॉगिन माहिती:",
      credDesc: "हा फोन नंबर आणि पासवर्ड सदस्यासोबत शेअर करा जेणेकरून ते लॉग इन करू शकतील.",
      addressLabel: "पत्ता",
      addressPlaceholder: "पत्ता टाका (पर्यायी)",
      joiningDateLabel: "सामील होण्याची तारीख",
      cancel: "रद्द करा",
      submit: "सदस्य जोडा",
      submitting: "जोडत आहे...",
      validationPhone: "कृपया वैध १० अंकी मोबाईल नंबर टाका",
      validationPassword: "पासवर्ड किमान ६ अक्षरांचा असावा",
      validationRequiredName: "पूर्ण नाव आवश्यक आहे",
      validationRequiredPhone: "फोन नंबर आवश्यक आहे",
      validationRequiredPassword: "पासवर्ड आवश्यक आहे",
    },
    en: {
      title: "Add Member",
      tipTitle: "Note:",
      tipDesc: "Members added here are auto-approved.",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Enter full name",
      nameMarathiLabel: "Name in Marathi",
      nameMarathiPlaceholder: "Enter Marathi name (optional)",
      phoneLabel: "Phone",
      phonePlaceholder: "10-digit mobile number",
      passwordLabel: "Password",
      passwordPlaceholder: "Min 6 characters",
      credTitle: "Login Credentials:",
      credDesc: "Share this phone and password with the member to let them sign in.",
      addressLabel: "Address",
      addressPlaceholder: "Enter address (optional)",
      joiningDateLabel: "Joining Date",
      cancel: "Cancel",
      submit: "Add Member",
      submitting: "Adding...",
      validationPhone: "Please enter a valid 10-digit phone number",
      validationPassword: "Password must be at least 6 characters long",
      validationRequiredName: "Full Name is required",
      validationRequiredPhone: "Phone number is required",
      validationRequiredPassword: "Password is required",
    }
  }
  const t = T[lang]

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // Clear previous errors
    const currentErrors = { name: "", phone: "", password: "" }
    let hasValidationError = false

    if (!form.name.trim()) {
      currentErrors.name = t.validationRequiredName
      hasValidationError = true
    }

    if (!form.phone.trim()) {
      currentErrors.phone = t.validationRequiredPhone
      hasValidationError = true
    } else if (form.phone.length !== 10 || !/^\d+$/.test(form.phone)) {
      currentErrors.phone = t.validationPhone
      hasValidationError = true
    }

    if (!form.password.trim()) {
      currentErrors.password = t.validationRequiredPassword
      hasValidationError = true
    } else if (form.password.length < 6) {
      currentErrors.password = t.validationPassword
      hasValidationError = true
    }

    setErrors(currentErrors)
    if (hasValidationError) return

    setLoading(true)
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "MEMBER_LIMIT_REACHED") {
          setLimitError(data)
          return
        }
        throw new Error(data.error || "Failed to create member")
      }
      
      toast.success(`${form.name} ${lang === 'mr' ? 'यशस्वीरित्या जोडले गेले!' : 'successfully added!'}`)
      
      const savedForm = { ...form }

      // Reset form states
      setForm({ 
        name: "", 
        name_marathi: "", 
        phone: "", 
        password: "",
        address: "", 
        joining_date: new Date().toISOString().split("T")[0] 
      })
      setErrors({ name: "", phone: "", password: "" })
      
      onClose()
      if (onSuccess) {
        onSuccess({
          name: savedForm.name,
          phone: savedForm.phone,
          password: savedForm.password
        })
      } else {
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || (lang === 'mr' ? "सदस्य जोडणे अयशस्वी झाले" : "Failed to add member"))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      
      {/* Modal Box */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        
        {/* HEADER — never scrolls */}
        <div className="shrink-0 bg-[#1B2B6B] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{t.title}</h2>
              <p className="text-blue-100 text-xs">{lang === 'mr' ? "नवीन सदस्याची माहिती भरा" : "Fill new member information"}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY — scrolls independently */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          
          {/* Tip Info Box */}
          <div className="bg-[#E85D26]/10 border border-[#E85D26]/20 rounded-xl p-3 flex gap-2.5 items-start">
            <Info size={15} className="text-[#E85D26] mt-0.5 shrink-0" />
            <p className="text-xs text-[#E85D26] font-semibold leading-relaxed">
              <strong>{t.tipTitle}</strong> {t.tipDesc}
            </p>
          </div>

          {/* Limit Error Banner */}
          {limitError && (
            <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500/20 rounded-xl p-4 space-y-3 flex flex-col items-center text-center animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-bold text-sm">
                <AlertCircle size={18} />
                <span>
                  {lang === 'mr' 
                    ? "सदस्य मर्यादा पोहोचली! योजना अपग्रेड करा" 
                    : "Member limit reached! Please upgrade your plan"}
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold leading-relaxed">
                {lang === 'mr'
                  ? `आपल्या चालू योजनेची (${limitError.currentPlan}) सदस्य मर्यादा ${limitError.maxMembers} पूर्ण झाली आहे.`
                  : `Your current plan (${limitError.currentPlan}) limit of ${limitError.maxMembers} members has been reached.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push("/subscribe")
                }}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>🚀</span>
                <span>{lang === 'mr' ? "योजना अपग्रेड करा →" : "Upgrade Plan →"}</span>
              </button>
            </div>
          )}

          {/* Row 1: Full name + Marathi name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.fullNameLabel} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <User size={14} />
                </div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value })
                    setErrors({ ...errors, name: "" })
                  }}
                  className={`w-full bg-gray-50 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:border-[#E85D26] focus:bg-white transition-all placeholder:text-gray-400 font-medium ${
                    errors.name ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-[#E85D26]"
                  }`}
                  placeholder={t.fullNamePlaceholder}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold animate-pulse">
                  <AlertCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

            {/* Name Marathi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.nameMarathiLabel}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Type size={14} />
                </div>
                <input
                  type="text"
                  value={form.name_marathi}
                  onChange={(e) => setForm({ ...form, name_marathi: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] focus:bg-white transition-all placeholder:text-gray-400 font-medium"
                  placeholder={t.nameMarathiPlaceholder}
                />
              </div>
            </div>

          </div>

          {/* Row 2: Phone + Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.phoneLabel} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Phone size={14} />
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
                    setErrors({ ...errors, phone: "" })
                  }}
                  className={`w-full bg-gray-50 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:border-[#E85D26] focus:bg-white transition-all placeholder:text-gray-400 font-medium ${
                    errors.phone ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-[#E85D26]"
                  }`}
                  placeholder={t.phonePlaceholder}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold animate-pulse">
                  <AlertCircle size={11} /> {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.passwordLabel} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock size={14} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    setErrors({ ...errors, password: "" })
                  }}
                  className={`w-full bg-gray-50 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:border-[#E85D26] focus:bg-white transition-all placeholder:text-gray-400 font-medium ${
                    errors.password ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-[#E85D26]"
                  }`}
                  placeholder={t.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold animate-pulse">
                  <AlertCircle size={11} /> {errors.password}
                </p>
              )}
            </div>

          </div>

          {/* Row 3: Credential info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
            <Lock size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed font-semibold">
              {t.credDesc}
            </p>
          </div>

          {/* Row 4: Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t.addressLabel}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                <MapPin size={14} />
              </div>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:border-[#E85D26] focus:bg-white transition-all placeholder:text-gray-400 font-medium"
                placeholder={t.addressPlaceholder}
              />
            </div>
          </div>

          {/* Row 5: Joining date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t.joiningDateLabel}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Calendar size={14} />
              </div>
              <input
                type="date"
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:border-[#E85D26] focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
          </div>

        </form>

        {/* FOOTER — never scrolls */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 rounded-b-2xl px-6 py-4 flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 focus:outline-none"
          >
            {t.cancel}
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSubmit()} 
            disabled={loading}
            className="flex-1 bg-[#E85D26] hover:bg-[#D04E1A] text-white py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 focus:outline-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <UserPlus size={15} />
                + {t.submit}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
