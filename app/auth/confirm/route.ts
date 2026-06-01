import { createServerClient } from "@supabase/ssr"
import { type EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/reset-password"

  // Load the site URL from environment or fallback to request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  try {
    // 1. Always await cookies in Next.js 15+
    const cookieStore = await cookies()

    // 2. Initialize Supabase Server Client directly to ensure absolute control over cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
      ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Auth Confirm Route] Error: Missing Supabase Environment Variables.")
      return NextResponse.redirect(new URL("/sign-in?error=server_error", siteUrl))
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (cookieErr: any) {
            // Safe catch-all to prevent Next.js 15+ from crashing during Server Component / Route Handler cookie writes
            console.warn("[Auth Confirm Route] Cookie setAll warning (non-fatal):", cookieErr.message)
          }
        },
      },
    })

    // 3. Handle PKCE Code Authorization Flow
    if (code) {
      console.log("[Auth Confirm Route] Initiating PKCE flow with code exchange...")
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("[Auth Confirm Route] PKCE Code Exchange Failure:", error.message)
        return NextResponse.redirect(new URL("/sign-in?error=invalid_reset_link", siteUrl))
      }
      console.log("[Auth Confirm Route] PKCE Code Exchange Successful. Redirecting to:", next)
      return NextResponse.redirect(new URL(next, siteUrl))
    }

    // 4. Handle OTP Token Hash Recovery Flow
    if (token_hash && type) {
      console.log(`[Auth Confirm Route] Initiating OTP verification flow: type=${type}...`)
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      if (error) {
        console.error("[Auth Confirm Route] OTP Verification Failure:", error.message)
        return NextResponse.redirect(new URL("/sign-in?error=invalid_reset_link", siteUrl))
      }
      console.log("[Auth Confirm Route] OTP Verification Successful. Redirecting to:", next)
      return NextResponse.redirect(new URL(next, siteUrl))
    }

    // Missing query parameters
    console.error("[Auth Confirm Route] Error: Missing both PKCE code and OTP token_hash parameters.")
    return NextResponse.redirect(new URL("/sign-in?error=invalid_reset_link", siteUrl))

  } catch (err: any) {
    console.error("[Auth Confirm Route] Fatal Route Exception Caught:", err.message || err)
    return NextResponse.redirect(new URL("/sign-in?error=server_error", siteUrl))
  }
}
