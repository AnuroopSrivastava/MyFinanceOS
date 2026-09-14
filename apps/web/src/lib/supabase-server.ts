import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'

type CookieStore = Awaited<ReturnType<typeof cookies>>

// Server-side Supabase client for API route handlers, mirroring the cookie
// persistence pattern of app/auth/callback/route.ts: session cookies are
// written to the live cookie store and, when a response is supplied, onto
// the outgoing response as httpOnly cookies.
export function createSupabaseRouteClient(
  cookieStore: CookieStore,
  response?: NextResponse,
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore if called from a context where the cookie store cannot be modified
          }
          response?.cookies.set(name, value, options)
        })
      },
    },
  })
}
