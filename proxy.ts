import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that never need auth checks
const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/join',
  '/pending',
  '/rejected',
  '/api/organizations/by-code',
  '/api/organizations/join',
  '/api/auth',
  '/api/subscription/',
  '/api/cron/',
  '/_next',
  '/favicon',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes — no Supabase call needed
  if (pathname === '/' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    const res = NextResponse.next()
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  }

  let response = NextResponse.next({ request })
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // Read env — use whichever key exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // MUST call getUser — refreshes session token
  let user = null
  let userError = null
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user || null
    userError = error
  } catch (err: any) {
    userError = err
  }

  // Not authenticated → sign-in (or 401 for API routes)
  if (userError || !user) {
    if (pathname === '/sign-in') return response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Fetch member record
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, role, status, organization_id')
    .eq('user_id', user.id)
    .maybeSingle()


  // ADD THIS RIGHT HERE:
  console.log('[PROXY]', {
    path: pathname,
    role: member?.role,
    status: member?.status,
    hasUser: !!user
  })

  // DB error → pass through, don't loop
  if (memberError) {
    console.error('[proxy] DB error:', memberError.message)
    return response
  }

  // Authenticated but no member record → onboarding (new superadmin)
  if (!member) {
    if (pathname === '/onboarding' || pathname.startsWith('/api/')) return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Member exists — never send to onboarding
  if (pathname === '/onboarding') {
    return NextResponse.redirect(
      new URL(member.role === 'MEMBER' ? '/member' : '/dashboard', request.url)
    )
  }

  // Status-based gates
  if (member.status === 'PENDING') {
    if (pathname === '/pending' || pathname.startsWith('/api/')) return response
    return NextResponse.redirect(new URL('/pending', request.url))
  }
  if (member.status === 'REJECTED') {
    if (pathname === '/rejected' || pathname.startsWith('/api/')) return response
    return NextResponse.redirect(new URL('/rejected', request.url))
  }

  // Root → role home
  if (pathname === '/') {
    const home = member.role === 'MEMBER' ? '/member' : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  const isAdminRole = ['SUPERADMIN', 'ADMIN'].includes(member.role)

  // SUPERADMIN and ADMIN cannot go to /member portal
  if (isAdminRole && (
    pathname === '/member' || pathname.startsWith('/member/')
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // MEMBER cannot go to admin paths
  const ADMIN_PATHS = [
    '/dashboard', '/meetings', '/members',
    '/loans', '/reports', '/payments', '/expenses'
  ]
  if (member.role === 'MEMBER' &&
    ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  // ADMIN cannot access settings
  if (member.role === 'ADMIN' && pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// Custom platform proxy compatibility wrapper
export async function proxy(request: NextRequest) {
  return middleware(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',],
}


