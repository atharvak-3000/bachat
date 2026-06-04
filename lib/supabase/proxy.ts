import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/auth/callback", "/join", "/pending", "/rejected", "/forgot-password", "/reset-password", "/auth/confirm", "/api/subscription/", "/api/cron/"]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err) {}

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  if (isPublic) return supabaseResponse

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, role, is_active, status")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!member) {
    if (!pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    return supabaseResponse
  }

  if (member.status === "PENDING") {
    if (!pathname.startsWith("/pending")) {
      return NextResponse.redirect(new URL("/pending", request.url))
    }
    return supabaseResponse
  }

  if (member.status === "REJECTED") {
    if (!pathname.startsWith("/rejected")) {
      return NextResponse.redirect(new URL("/rejected", request.url))
    }
    return supabaseResponse
  }

  if (!member.is_active) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (pathname.startsWith("/member") && member.role !== "MEMBER") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const adminPaths = ["/dashboard", "/members", "/meetings", "/loans", "/settings", "/reports"]
  if (adminPaths.some((p) => pathname.startsWith(p)) && member.role === "MEMBER") {
    return NextResponse.redirect(new URL("/member", request.url))
  }

  return supabaseResponse
}
