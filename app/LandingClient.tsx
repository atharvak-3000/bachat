"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { 
  Menu, 
  X, 
  Check, 
  Quote, 
  Star, 
  ChevronRight
} from "lucide-react"
import DarkModeToggle from "@/components/ui/DarkModeToggle"

interface LandingClientProps {
  isAuthenticated: boolean
  role: string | null
  status: string | null
}

const T = {
  mr: {
    features: "सुविधा",
    howItWorks: "कसे काम करते",
    testimonials: "अभिप्राय",
    pricing: "किंमत",
    goToDashboard: "डॅशबोर्डवर जा",
    signIn: "साइन इन करा",
    startToday: "आजच सुरुवात करा !",
    signInOrRegister: "साइन इन करा / गटाची नोंदणी करा",
    mgmtBadge: "✨ बचत गट व्यवस्थापन",
    heroHeading: "बचत गट आणि स्वयंसहायता समूहांसाठी संपूर्ण डिजिटल लेजर",
    heroSubtitle: "लेजर, मासिक बचत, कर्ज आणि बैठकींच्या नोंदी, सर्व काही एकाच सुरक्षित प्लॅटफॉर्मवर. सोपे, विश्वासार्ह आणि १००% पारदर्शक व्यवस्थापन.",
    trustItem1: "१०००+ व्यवहार व्यवस्थापित",
    trustItem2: "५०+ सक्रिय बचत गट",
    trustItem3: "सुरक्षित क्लाउड बॅकअप",
    trustItem4: "सोपे मराठी इंटरफेस",
    featuresBadge: "आमच्या सुविधा",
    featuresHeading: "बचत गटांसाठी खास आणि शक्तिशाली सुविधा",
    featuresSubtitle: "कागदी रजिस्टरला आता निरोप द्या आणि डिजिटल लेजरच्या साहाय्याने तुमच्या बचत गटाच्या कारभारात अधिक पारदर्शकता आणि अचूकता आणा.",
    feat1Title: "ऑटोमॅटिक लेजर",
    feat1Desc: "रियल-टाइम बॅलन्स शीट, सुरुवातीची शिल्लक (ओपनिंग बॅलन्स), मासिक जमा-खर्च आणि पावत्यांच्या हिशोबाच्या नोंदी आता आपोआप अपडेट होतील.",
    feat2Title: "कर्ज आणि ईएमआय व्यवस्थापन",
    feat2Desc: "नवीन कर्जाचा अर्ज, कर्जाची मंजुरी मिळवणे, मासिक व्याजाची गणना आणि परतफेडीच्या तारखांच्या नोंदी.",
    feat3Title: "डिजिटल पासबुक",
    feat3Desc: "सर्व सदस्य त्यांची स्वतःची बचत, कर्जाचा हिशोब आणि बैठकींची उपस्थिती थेट स्वतःच्या फोनवर सहज पाहू शकतात.",
    feat4Title: "बैठक नोंदी आणि हजेरी",
    feat4Desc: "मासिक बैठकींना उपस्थितीची नोंद एका क्लिकवर करता येईल आणि बैठकीतील महत्त्वाच्या चर्चा व निर्णयांच्या नोंदी डिजिटल पद्धतीने ठेवता येतील.",
    feat5Title: "केवायसी पडताळणी",
    feat5Desc: "गटाच्या संपूर्ण सुरक्षेसाठी सदस्यांचे आधार कार्ड आणि पॅन कार्ड तपासून कागदपत्रांची योग्य पडताळणी करून नोंद ठेवता येईल.",
    feat6Title: "झटपट सूचना",
    feat6Desc: "बैठक निश्चित झाल्यावर, कर्जाचा अर्ज केल्यावर किंवा मंजुरी मिळताच मोबाईलवर त्वरित मेसेज आणि अलर्ट मिळवा.",
    howItWorksHeading: "कसे काम करते?",
    howItWorksSubtitle: "३ सोप्या पाऱ्यांमध्ये डिजिटल हिशोब सुरू करा",
    step1Num: "०१",
    step1Title: "बचत गट तयार करा",
    step1Desc: "तुमचा गट नोंदवा आणि सेटअप करा",
    step2Num: "०२",
    step2Title: "सदस्य जोडा",
    step2Desc: "सदस्यांची माहिती आणि KYC जोडा",
    step3Num: "०३",
    step3Title: "हिशोब व्यवस्थापित करा",
    step3Desc: "सभा, बचत आणि कर्जाचा हिशोब ठेवा",
    testimonialsHeading: "आमचे वापरकर्ते काय म्हणतात",
    test1Quote: "आमच्या बचत गटाचा हिशोब आता पूर्णपणे पारदर्शक झाला.",
    test1Name: "सुनीता पाटील",
    test1Loc: "नाशिक",
    test2Quote: "कर्ज व्यवस्थापन खूप सोपे झाले, वेळ वाचला.",
    test2Name: "रमेश जाधव",
    test2Loc: "पुणे",
    test3Quote: "मराठीत सोपे वापरणे — आमच्या गटासाठी एकदम योग्य.",
    test3Name: "मीरा शिंदे",
    test3Loc: "औरंगाबाद",
    ctaHeading: "आजच तुमचा बचत गट सुरू करा",
    ctaSubtitle: "मोफत सुरुवात करा — कोणतेही क्रेडिट कार्ड नाही",
    footerDesc: "मराठी बचत गटांसाठी हिशोब आणि कर्ज नियोजनाचे सर्वात सुरक्षित व सोपे डिजिटल पोर्टल.",
    footerCopyright: "© 2026 BachatGatOnline. सर्व हक्क राखीव.",
    footerDesigned: "वेबीझ स्क्वेअर सॉफ्टवेअर सोल्युशन्स एलएलपी द्वारे डिझाइन आणि विकसित"
  },
  en: {
    features: "Features",
    howItWorks: "How It Works",
    testimonials: "Testimonials",
    pricing: "Pricing",
    goToDashboard: "Go to Dashboard",
    signIn: "Sign In",
    startToday: "Start Today!",
    signInOrRegister: "Sign In / Register Group",
    mgmtBadge: "✨ Bachat Gat Management",
    heroHeading: "Complete Digital Ledger for Bachat Gats & Self-Help Groups",
    heroSubtitle: "Ledger, monthly savings, loans, and meeting records, all on one secure platform. Simple, reliable, and 100% transparent management.",
    trustItem1: "1000+ Transactions Managed",
    trustItem2: "50+ Active Bachat Gats",
    trustItem3: "Secure Cloud Backup",
    trustItem4: "Simple Vernacular Interface",
    featuresBadge: "Our Features",
    featuresHeading: "Special and Powerful Features for Bachat Gats",
    featuresSubtitle: "Say goodbye to paper registers and bring more transparency and accuracy to your Bachat Gat management with a digital ledger.",
    feat1Title: "Automatic Ledger",
    feat1Desc: "Real-time balance sheets, opening balances, monthly income-expenses, and receipt entries will now update automatically.",
    feat2Title: "Loan & EMI Management",
    feat2Desc: "Apply for new loans, get loan approvals, calculate monthly interest, and track repayment dates.",
    feat3Title: "Digital Passbook",
    feat3Desc: "All members can easily view their own savings, loan history, and meeting attendance directly on their own phones.",
    feat4Title: "Meeting Records & Attendance",
    feat4Desc: "Record attendance for monthly meetings with a single click, and keep digital logs of key discussions and decisions.",
    feat5Title: "KYC Verification",
    feat5Desc: "For complete security of the group, verify and record documents by checking members' Aadhaar and PAN cards.",
    feat6Title: "Instant Notifications",
    feat6Desc: "Get instant mobile messages and alerts when a meeting is scheduled, a loan is applied for, or approved.",
    howItWorksHeading: "How It Works",
    howItWorksSubtitle: "Start digital accounting in 3 easy steps",
    step1Num: "01",
    step1Title: "Create Bachat Gat",
    step1Desc: "Register and set up your group",
    step2Num: "02",
    step2Title: "Add Members",
    step2Desc: "Add member details and KYC documents",
    step3Num: "03",
    step3Title: "Manage Accounts",
    step3Desc: "Keep track of meetings, savings, and loans",
    testimonialsHeading: "What Our Users Say",
    test1Quote: "Our Bachat Gat accounting has now become completely transparent.",
    test1Name: "Sunita Patil",
    test1Loc: "Nashik",
    test2Quote: "Loan management became very simple, saved a lot of time.",
    test2Name: "Ramesh Jadhav",
    test2Loc: "Pune",
    test3Quote: "Easy to use in Marathi — perfect for our group.",
    test3Name: "Mira Shinde",
    test3Loc: "Aurangabad",
    ctaHeading: "Start Your Bachat Gat Today",
    ctaSubtitle: "Start for free — no credit card required",
    footerDesc: "The most secure and easy digital portal for accounting and loan planning for Marathi Bachat Gats.",
    footerCopyright: "© 2026 BachatGatOnline. All rights reserved.",
    footerDesigned: "Designed and Developed by Webiz Square Software Solutions LLP"
  }
}

export default function LandingClient({ isAuthenticated, role, status }: LandingClientProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<'mr'|'en'>('mr')
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === 'dark'

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang((localStorage.getItem('bb_lang') as 'mr'|'en') || 'mr')
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'mr' : 'en'
    setLang(newLang)
    localStorage.setItem('bb_lang', newLang)
    window.dispatchEvent(new CustomEvent('bb-lang-change', { detail: newLang }))
  }

  const t = T[lang]

  // Track scroll for navbar blur
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleCTA = () => {
    if (isAuthenticated) {
      if (status === 'PENDING') router.push('/pending')
      else if (status === 'REJECTED') router.push('/rejected')
      else if (role === 'MEMBER') router.push('/member')
      else router.push('/dashboard')
    } else {
      router.push('/sign-in')
    }
  }

  const handleSignIn = () => {
    router.push('/sign-in')
  }

  const handleSignUp = () => {
    router.push('/sign-up')
  }

  const features = [
    {
      title: t.feat1Title,
      description: t.feat1Desc,
      img: "/Bachat Gat icons/Features/Automatic Ledger.svg"
    },
    {
      title: t.feat2Title,
      description: t.feat2Desc,
      img: "/Bachat Gat icons/Features/Loan & EMI Management.svg"
    },
    {
      title: t.feat3Title,
      description: t.feat3Desc,
      img: "/Bachat Gat icons/Features/Digital Passbook.svg"
    },
    {
      title: t.feat4Title,
      description: t.feat4Desc,
      img: "/Bachat Gat icons/Features/Meeting Records.svg"
    },
    {
      title: t.feat5Title,
      description: t.feat5Desc,
      img: "/Bachat Gat icons/Features/KYC Verification.svg"
    },
    {
      title: t.feat6Title,
      description: t.feat6Desc,
      img: "/Bachat Gat icons/Features/Instant Notifications.svg"
    }
  ]

  const steps = [
    {
      number: t.step1Num,
      title: t.step1Title,
      description: t.step1Desc,
      img: "/Bachat Gat icons/How It Works/Create Bachat Gat.svg"
    },
    {
      number: t.step2Num,
      title: t.step2Title,
      description: t.step2Desc,
      img: "/Bachat Gat icons/How It Works/Add Member.svg"
    },
    {
      number: t.step3Num,
      title: t.step3Title,
      description: t.step3Desc,
      img: "/Bachat Gat icons/How It Works/Manage Accounts.svg"
    }
  ]

  const testimonials = [
    {
      quote: t.test1Quote,
      name: t.test1Name,
      location: t.test1Loc,
      stars: 5
    },
    {
      quote: t.test2Quote,
      name: t.test2Name,
      location: t.test2Loc,
      stars: 5
    },
    {
      quote: t.test3Quote,
      name: t.test3Name,
      location: t.test3Loc,
      stars: 5
    }
  ]

  return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#0F1117] flex flex-col font-sans selection:bg-[#1B2B6B] selection:text-white antialiased transition-colors duration-200">
      
      {/* 1. Navbar */}
      <header className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-white/95 dark:bg-[#1A1D27]/95 backdrop-blur-md border-b border-blue-100 dark:border-gray-800 shadow-sm" : "bg-white dark:bg-[#1A1D27] border-b border-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Left: BachatBook Logo */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative h-9 w-36">
              <Image 
                src="/logo-horizontal.png"
                alt="BachatGatOnline"
                fill
                sizes="144px"
                className="object-contain dark:brightness-0 dark:invert"
                priority
              />
            </div>
          </div>

          {/* Center: Nav links (Desktop) + Translator Toggle */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition-colors">{t.features}</a>
            <a href="#how-it-works" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition-colors">{t.howItWorks}</a>
            <a href="#testimonials" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition-colors">{t.testimonials}</a>
            <a href="#pricing" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition-colors">{t.pricing}</a>
            
            {/* Translator Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/30 text-xs font-bold text-[#E8530A] dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/40 active:scale-95 transition-all shadow-sm"
              title="Switch Language / भाषा बदला"
            >
              <span>🌐</span>
              <span className="font-extrabold">{lang === "en" ? "मराठी" : "English"}</span>
            </button>

            <DarkModeToggle className="bg-blue-50 hover:bg-blue-100 text-gray-700 border border-blue-100/50 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:text-white dark:border-blue-900/40" />
          </nav>

          {/* Right: CTA Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handleCTA}
                className="bg-[#E8530A] hover:bg-[#C94208] text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition duration-150 active:scale-95 shadow-md shadow-orange-500/10"
              >
                {t.goToDashboard}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-sm font-extrabold text-[#1B2B6B] dark:text-white bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900/30 rounded-xl px-5 py-2.5 transition active:scale-95"
                >
                  {t.signIn}
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-[#E8530A] hover:bg-[#C94208] text-white text-sm font-extrabold px-5 py-2.5 rounded-xl transition duration-150 active:scale-95 shadow-md shadow-orange-500/10"
                >
                  {t.startToday}
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-3">
            <DarkModeToggle className="bg-blue-50 hover:bg-blue-100 text-gray-700 border border-blue-100/50 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:text-white dark:border-blue-900/40" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] focus:outline-none p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#1A1D27] border-b border-gray-100 dark:border-gray-800 px-6 py-6 space-y-6 shadow-lg animate-fadeIn">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-gray-700 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition"
              >
                {t.features}
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-gray-700 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition"
              >
                {t.howItWorks}
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-gray-700 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition"
              >
                {t.testimonials}
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-gray-700 dark:text-gray-300 hover:text-[#E8530A] dark:hover:text-[#E85D26] transition"
              >
                {t.pricing}
              </a>
              
              {/* Mobile Translator Toggle */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  toggleLanguage()
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-100 dark:border-orange-900/30 text-sm font-bold text-[#E8530A] dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/40 active:scale-95 transition-all"
              >
                <span>🌐 {lang === "en" ? "मराठी" : "English"}</span>
              </button>
            </nav>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleCTA()
                  }}
                  className="w-full text-center bg-[#E8530A] hover:bg-[#C94208] text-white font-extrabold py-3 rounded-2xl transition active:scale-95 shadow-md"
                >
                  {t.goToDashboard}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignIn()
                  }}
                  className="w-full text-center bg-gradient-to-r from-[#1B2B6B] to-[#2E4CAD] hover:shadow-lg text-white font-extrabold py-3 rounded-2xl transition active:scale-95"
                >
                  {t.signInOrRegister}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="bg-gradient-to-br from-[#1B2B6B] via-[#2E4CAD] to-[#1B2B6B] dark:from-[#0D1021] dark:via-[#1B2B6B] dark:to-[#0D1021] text-white py-20 lg:py-32 px-6 relative overflow-hidden flex-shrink-0">
        
        {/* Glow circles */}
        <div className="absolute top-12 right-1/4 w-96 h-96 rounded-full bg-[#2E4CAD]/20 dark:bg-blue-900/10 blur-3xl -z-10" />
        <div className="absolute bottom-12 left-10 w-80 h-80 rounded-full bg-[#E8530A]/10 dark:bg-orange-950/5 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
          
          {/* Left Side: Overlapping/tilted dashboard preview images */}
          <div className="w-full lg:w-[55%] flex justify-center items-center p-4">
            <div className="relative flex items-center justify-center w-full max-w-[640px] lg:max-w-none">
              {/* Desktop Preview */}
              <div className="relative transition-all duration-300 ease-out transform rotate-[-6deg] hover:rotate-0 hover:scale-105 z-10 w-full max-w-[780px]">
                <Image
                  src={isDarkMode ? "/Dashboard_dark_desktop.png" : "/Dashboard_light_desktop.png"}
                  alt="Desktop Dashboard Preview"
                  width={780}
                  height={480}
                  className="rounded-2xl shadow-2xl object-cover w-full h-auto"
                  priority
                />
              </div>
              
              {/* Mobile Preview */}
              <div className="absolute right-0 lg:right-[-20px] transition-all duration-300 ease-out transform rotate-[4deg] hover:rotate-0 hover:scale-105 z-20 w-[30%] max-w-[220px]">
                <Image
                  src={isDarkMode ? "/Dashboard_dark_mobile.png" : "/Dashboard_light_mobile.png"}
                  alt="Mobile Dashboard Preview"
                  width={220}
                  height={380}
                  className="rounded-2xl shadow-2xl object-cover w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Side: Tagline, subtitle, and CTA buttons */}
          <div className="w-full lg:w-[38%] text-center lg:text-left space-y-6 flex flex-col items-center lg:items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-full text-orange-400 dark:text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">
              {t.mgmtBadge}
            </div>

            {/* Heading */}
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-normal lg:leading-normal">
              {t.heroHeading}
            </h1>

            {/* Subtitle / Description Paragraph */}
            <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base font-medium leading-relaxed">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-2 w-full">
              {isAuthenticated ? (
                <button
                  onClick={handleCTA}
                  className="bg-[#E8530A] hover:bg-[#C94208] shadow-lg hover:shadow-xl hover:scale-105 transition-all px-10 py-4 rounded-2xl text-white font-extrabold text-base w-full sm:w-auto"
                >
                  {t.goToDashboard}
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-[#E8530A] hover:bg-[#C94208] shadow-lg hover:shadow-xl hover:scale-105 transition-all px-10 py-4 rounded-2xl text-white font-extrabold text-base w-full sm:w-auto"
                >
                  {t.signInOrRegister}
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Trust Bar */}
      <section className="bg-white dark:bg-[#1A1D27] border-y border-blue-100 dark:border-gray-800 py-4 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-none md:justify-center items-center gap-8 py-1">
            {[
              t.trustItem1,
              t.trustItem2,
              t.trustItem3,
              t.trustItem4
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Check className="w-3.5 h-3.5 font-black" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-20 md:py-28 px-6 bg-white dark:bg-[#0F1117] scroll-mt-16">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-[#1B2B6B] dark:text-blue-300 text-xs font-black rounded-full uppercase tracking-wider">
              {t.featuresBadge}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight pt-2">
              {t.featuresHeading}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm font-medium max-w-2xl mx-auto mt-3 leading-relaxed">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#1A1D27] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#1B2B6B] dark:text-blue-400 mb-6 shadow-sm">
                  <Image src={feat.img} alt={feat.title} width={28} height={28} />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg mb-2">{feat.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-semibold leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-gray-50/50 dark:bg-[#1A1D27]/10 border-y border-gray-100 dark:border-gray-850 scroll-mt-16">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t.howItWorksHeading}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-4 relative bg-white dark:bg-[#1A1D27] p-8 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm">
                {/* Step number badge */}
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#E8530A] text-white flex items-center justify-center font-extrabold shadow-md border-4 border-white dark:border-[#1A1D27]">
                  {step.number}
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#1B2B6B] dark:text-blue-400 flex items-center justify-center shadow-sm">
                  <Image src={step.img} alt={step.title} width={32} height={32} />
                </div>

                <h3 className="text-lg font-black text-gray-900 dark:text-white pt-2">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-semibold leading-relaxed max-w-[240px]">
                  {step.description}
                </p>

                {/* Connect arrow on desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 text-blue-400 dark:text-blue-900">
                    <ChevronRight className="w-6 h-6 font-black" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-28 px-6 bg-white dark:bg-[#0F1117] scroll-mt-16">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t.testimonialsHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#1A1D27] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-850 hover:shadow-md transition-all duration-350 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="text-blue-500 dark:text-blue-400">
                    <Quote className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold italic text-sm leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-850 mt-6 space-y-3">
                  <div className="flex gap-1 text-[#E8530A]">
                    {[...Array(test.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#E8530A] text-[#E8530A]" />
                    ))}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">{test.name}</h4>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wider">{test.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA Banner */}
      <section id="pricing" className="py-12 px-4 bg-white dark:bg-[#0F1117] scroll-mt-16">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#1B2B6B] to-[#2E4CAD] dark:from-[#0D1021] dark:to-[#1B2B6B] rounded-3xl p-8 md:p-16 text-center text-white shadow-xl space-y-6 relative overflow-hidden">
          
          {/* Subtle bg overlay circle */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-2xl" />

          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            {t.ctaHeading}
          </h2>
          <p className="text-blue-100 font-semibold text-sm md:text-lg">
            {t.ctaSubtitle}
          </p>

          <div className="flex gap-4 justify-center items-center pt-4">
            {isAuthenticated ? (
              <button
                onClick={handleCTA}
                className="bg-white hover:bg-gray-100 text-[#1B2B6B] font-extrabold text-sm px-8 py-3.5 rounded-2xl transition duration-150 shadow-lg active:scale-95"
              >
                {t.goToDashboard}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-white hover:bg-gray-100 text-[#1B2B6B] font-extrabold text-sm px-10 py-3.5 rounded-2xl transition duration-150 shadow-lg active:scale-95 hover:scale-105 transform duration-200"
              >
                {t.signInOrRegister}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#1B2B6B] dark:bg-[#0D1021] text-blue-200 dark:text-gray-400 py-16 px-6 mt-auto border-t border-blue-900/10 dark:border-gray-900/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-blue-800/40 dark:border-gray-800/40 pb-12">
          
          {/* Left info column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 select-none text-white">
              <div className="relative h-8 w-32">
                <Image 
                  src="/logo-horizontal.png"
                  alt="BachatGatOnline"
                  fill
                  sizes="128px"
                  className="object-contain brightness-0 invert"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-blue-100 dark:text-gray-400 max-w-[280px] font-medium">
              {t.footerDesc}
            </p>
          </div>

          {/* Center Links column */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:justify-items-end">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white dark:text-gray-300 uppercase tracking-widest">Links</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><a href="#features" className="hover:text-white dark:hover:text-white transition">{t.features}</a></li>
                <li><a href="#pricing" className="hover:text-white dark:hover:text-white transition">{t.pricing}</a></li>
                <li><a href="#testimonials" className="hover:text-white dark:hover:text-white transition">{t.testimonials}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-blue-300 dark:text-gray-500">
          <span>{t.footerCopyright}</span>
          <span className="text-blue-300 dark:text-gray-500 text-xs">{t.footerDesigned}</span>
        </div>
      </footer>

    </div>
  )
}
