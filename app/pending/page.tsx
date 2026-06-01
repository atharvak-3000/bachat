"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PendingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let memberId: string | null = null
    let channel: any = null

    // Core check function
    const checkStatus = async (userId: string) => {
      setChecking(true)
      const { data: member } = await supabase
        .from('members')
        .select('id, status, role')
        .eq('user_id', userId)
        .maybeSingle()

      if (!member) {
        setChecking(false)
        return null
      }

      if (member.status === 'ACTIVE') {
        router.push(member.role === 'MEMBER' ? '/member' : '/dashboard')
        router.refresh()
        return true
      }

      if (member.status === 'REJECTED') {
        router.push('/rejected')
        return true
      }

      setChecking(false)
      return member
    }

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      // Check immediately on mount
      const result = await checkStatus(user.id)
      if (result === true || !result) return

      memberId = result.id

      // 1. Subscribe to Supabase Realtime for instant, sub-second redirects
      channel = supabase
        .channel('member-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'members',
            filter: `id=eq.${memberId}`
          },
          (payload: any) => {
            const updated = payload.new as { status: string, role: string }
            if (updated.status === 'ACTIVE') {
              router.push(updated.role === 'MEMBER' ? '/member' : '/dashboard')
              router.refresh()
            }
            if (updated.status === 'REJECTED') {
              router.push('/rejected')
            }
          }
        )
        .subscribe()
    }

    setup()

    // 2. Poll every 5 seconds as a robust, bulletproof fallback
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearInterval(interval)
        router.push('/sign-in')
        return
      }
      await checkStatus(user.id)
    }, 5000)

    return () => {
      clearInterval(interval)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      <div className="bg-white dark:bg-[#1A1D27] rounded-2xl shadow-lg dark:shadow-none p-8 max-w-md w-full text-center border border-transparent dark:border-gray-800">
        
        <div className="text-5xl mb-4">⏳</div>
        
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          विनंती प्रलंबित आहे
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Request Pending
        </p>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-4">
          तुमची विनंती गटाच्या प्रशासकाकडे पाठवली आहे.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          Your request has been sent to the group admin.
        </p>

        {/* Live checking indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-orange-500 dark:text-orange-400">
          <div className="w-2 h-2 rounded-full bg-orange-400 dark:bg-orange-500 animate-pulse" />
          Checking for approval automatically...
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          This page will redirect automatically once approved.
          <br />
          No need to refresh or do anything.
        </p>

        {/* Manual sign out option */}
        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/sign-in')
          }}
          className="mt-6 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
