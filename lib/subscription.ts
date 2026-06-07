import { redirect } from "next/navigation"

export function checkSubscriptionAccess(org?: {
  subscription_status?: string | null
  subscription_expires_at?: string | null
  trial_ends_at?: string | null
}) {
  if (!org) {
    redirect("/onboarding")
  }

  const now = new Date()

  // 1. If trial is active
  if (
    org.subscription_status === "TRIAL" && 
    org.trial_ends_at && 
    new Date(org.trial_ends_at) > now
  ) {
    return true
  }

  // 2. If subscription is active
  if (
    org.subscription_status === "ACTIVE" && 
    org.subscription_expires_at && 
    new Date(org.subscription_expires_at) > now
  ) {
    return true
  }

  // Otherwise, block and redirect to subscription payment screen
  redirect("/subscribe")
}

export function checkOnboardingGuard(org?: {
  subscription_status?: string | null
  subscription_expires_at?: string | null
  trial_ends_at?: string | null
}) {
  if (!org) return // allow to stay to create organisation

  const now = new Date()
  const hasActiveTrial = 
    org.subscription_status === "TRIAL" && 
    org.trial_ends_at && 
    new Date(org.trial_ends_at) > now

  const hasActiveSub = 
    org.subscription_status === "ACTIVE" && 
    org.subscription_expires_at && 
    new Date(org.subscription_expires_at) > now

  if (hasActiveTrial || hasActiveSub) {
    redirect("/dashboard")
  }
}
