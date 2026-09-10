import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPostHogClient } from '../../../src/lib/posthog-server'

// The OAuth code-exchange callback runs server-side on the hosted deployment.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // Ignore if called from context where cookieStore cannot be modified directly
              }
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const ph = getPostHogClient();
      if (ph) {
        // Use a stable anonymous ID since the user session is not yet hydrated client-side
        ph.capture({
          distinctId: 'anonymous_oauth',
          event: 'auth_callback_completed',
          properties: { provider: 'google', next }
        });
        await ph.flush();
      }
      return response
    }
    console.error('Auth code exchange error:', error)
  }

  // If code exchange fails or no code, return user safely to origin
  return NextResponse.redirect(`${origin}${next}`)
}

