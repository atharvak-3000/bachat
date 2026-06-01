'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function JoinContent() {
  const params = useSearchParams()
  const code = params.get('code') ?? '';
  console.log('Join page: code param', code);
  
  const [org, setOrg] = useState<{id:string,name:string,village:string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [infoNote, setInfoNote] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirm: ''
  })

  useEffect(() => {
    if (!code) { console.log('Join page: no code param'); setError('Invalid invite link'); setLoading(false); return }
    console.log('Join page: received code', code);
    fetch(`/api/organizations/by-code?code=${code}`)
      .then(r => {
        if (!r.ok) {
          console.error('Error fetching org:', r.status);
          setError('Invalid or expired invite link');
          return { error: true };
        }
        return r.json();
      })
      .then(d => {
        console.log('Organization fetched:', d);
        if (d.error) setError('Invalid or expired invite link')
        else setOrg(d)
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setLoading(false))
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfoNote('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return
    }
    if (form.phone.length !== 10 || !/^\d+$/.test(form.phone)) {
      setError('Enter a valid 10-digit phone number'); return
    }
    setSubmitting(true)

    let signupName = form.name
    try {
      const phoneCheck = await fetch(
        `/api/organizations/check-phone?orgId=${org!.id}&phone=${form.phone}`
      )
      const phoneData = await phoneCheck.json()
      
      if (phoneData.exists && phoneData.hasAccount) {
        setError('This phone number is already registered in this group. Please sign in instead.')
        setSubmitting(false)
        return
      }
      
      if (phoneData.exists && !phoneData.hasAccount) {
        // Admin pre-added them — show info message
        // Don't block, but inform them
        signupName = phoneData.memberName || form.name
        setForm(prev => ({ 
          ...prev, 
          name: signupName 
        }))
        setInfoNote(`You've been pre-added by admin as ${phoneData.memberName || 'a member'}. Completing signup will link your account.`)
      }
    } catch {
      // If check fails, let it through — API will catch it
    }

    try {
      const supabase = createClient()
      
      // 1. Sign up with Supabase auth using phone as fake email
      const fakeEmail = `91${form.phone}@bachatbook.app`

      const { data: authData, error: authError } = 
        await supabase.auth.signUp({
          email: fakeEmail,
          password: form.password,
          options: { data: { name: signupName, phone: form.phone } }
        })
      
      if (authError) {
        // If already registered, try to sign in instead
        if (authError.message.includes('already registered') || 
            authError.message.includes('already been registered') ||
            authError.message.includes('User already registered')) {
          const { data: signInData, error: signInError } = 
            await supabase.auth.signInWithPassword({
              email: fakeEmail, password: form.password
            })
          if (signInError) {
            setError('Phone number already registered. Use the sign-in page or check your password.')
            setSubmitting(false); return
          }
          // Signed in — link to member record via server API
          const res = await fetch('/api/organizations/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: signInData.user!.id,
              orgId: org!.id,
              name: signupName,
              phone: form.phone
            })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to join organization')
          window.location.href = data.redirect
          return
        }
        setError(authError.message)
        setSubmitting(false); return
      }
      
      if (!authData.user) {
        setError('Sign up failed. Try again.')
        setSubmitting(false); return
      }
      
      // 2. Link or create member record via server API
      const res = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          orgId: org!.id,
          name: signupName,
          phone: form.phone
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join organization')
      
      // 3. Hard redirect to avoid middleware race conditions
      window.location.href = data.redirect
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading invite...</p>
    </div>
  )

  if (!org) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-500 text-sm mt-2">
          Ask your group admin for a valid invite link.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-6">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🤝</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Join {org.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {org.village} · Bachat Gat
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
          <strong>Already added by admin?</strong> Use your registered phone number and sign up — your account will be linked automatically.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text" required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Sunita Patil"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number * (10 digits)
            </label>
            <div className="flex">
              <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                +91
              </span>
              <input
                type="tel" required maxLength={10} pattern="[0-9]{10}"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})}
                placeholder="9876543210"
                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Removed email field */}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password" required minLength={6}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password" required
              value={form.confirm}
              onChange={e => setForm({...form, confirm: e.target.value})}
              placeholder="Repeat password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {infoNote && (
            <p className="text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              {infoNote}
            </p>
          )}

          <p className="text-center text-xs text-gray-500 mt-3 mb-2">
            Sign in later using your phone number and this password.
          </p>

          <button
            type="submit" disabled={submitting}
            className="w-full bg-orange-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-orange-700 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Joining...' : 'Join Group'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <a href="/sign-in" className="text-orange-600 hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading invite...</p>
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}
