import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    console.log(`[BY-CODE] Received invite code: "${code}"`)
    const supabase = createAdminClient()
    const cleanCode = code.trim().toUpperCase()

    // 1. Try exact match
    let { data, error } = await supabase
      .from("organizations")
      .select("id, name, village, district, is_approved, subscription_status, group_code")
      .eq("group_code", cleanCode)
      .maybeSingle() // Use maybeSingle to prevent PGRST116 single-row errors

    if (error) {
      console.error("[BY-CODE] Supabase exact match query error:", error)
    }

    // 2. If no exact match, try normalization fallback (e.g. O <-> 0, I/L <-> 1)
    if (!data) {
      console.log(`[BY-CODE] Exact match not found for "${cleanCode}". Trying character normalization fallback...`)
      
      const normalize = (s: string) => {
        return s
          .toUpperCase()
          .replace(/O/g, '0') // Letter O -> Digit 0
          .replace(/[IL]/g, '1') // Letters I/L -> Digit 1
          .trim()
      }

      const normalizedTarget = normalize(cleanCode)
      console.log(`[BY-CODE] Normalized target: "${normalizedTarget}"`)

      const { data: allOrgs, error: allOrgsErr } = await supabase
        .from("organizations")
        .select("id, name, group_code, village, district, is_approved, subscription_status")

      if (allOrgsErr) {
        console.error("[BY-CODE] Fallback query error:", allOrgsErr)
      } else if (allOrgs) {
        const matched = allOrgs.find(org => normalize(org.group_code) === normalizedTarget)
        if (matched) {
          console.log(`[BY-CODE] Normalized match found! Cleaned: "${matched.group_code}" (Org: ${matched.name})`)
          data = matched
          error = null
        } else {
          console.log(`[BY-CODE] No normalized match found among ${allOrgs.length} organizations.`)
        }
      }
    }

    if (error || !data) {
      console.warn(`[BY-CODE] Organization not found for code: "${code}"`)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    console.log(`[BY-CODE] Successfully fetched organization data:`, data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[BY-CODE] Internal server error:", error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}
