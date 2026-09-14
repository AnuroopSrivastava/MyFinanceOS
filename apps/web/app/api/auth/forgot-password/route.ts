import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseRouteClient } from '../../../../src/lib/supabase-server'
import { captureSecurityEvent } from '../../../../src/lib/posthog-server'
import {
  authRateLimiter,
  getClientIp,
  hashIdentifier,
  AUTH_RATE_LIMITS,
} from '../../../../src/lib/rate-limit'

// Unauthenticated endpoint: every request is hostile until rate-limited.
// Order of operations is deliberate — validate input, check both limiter
// dimensions (per-IP and per-email), and only then talk to Supabase.
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let email: string | undefined
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : undefined
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    // Same shape as the success response; enumeration via validation errors
    // would reveal which addresses look "real".
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const ip = getClientIp(request)
  const emailHash = hashIdentifier(email)
  const { forgotPassword } = AUTH_RATE_LIMITS

  const ipLimit = authRateLimiter.check(
    `forgot:ip:${ip}`,
    forgotPassword.ip.limit,
    forgotPassword.ip.windowMs,
  )
  const emailLimit = authRateLimiter.check(
    `forgot:email:${emailHash}`,
    forgotPassword.email.limit,
    forgotPassword.email.windowMs,
  )

  if (!ipLimit.ok || !emailLimit.ok) {
    const retryAfterSec = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec)
    await captureSecurityEvent('password_reset_rate_limited', {
      email_hash: emailHash,
      scope: !ipLimit.ok ? 'ip' : 'email',
    })
    return NextResponse.json(
      { ok: true },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }

  const { origin } = new URL(request.url)
  const cookieStore = await cookies()
  const supabase = createSupabaseRouteClient(cookieStore)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  if (error) {
    // Server-side log only. The response must stay identical whether or not
    // the address exists in the system (anti-enumeration).
    console.error('Password reset request error:', error.message)
  }

  await captureSecurityEvent('password_reset_requested', { email_hash: emailHash })

  return NextResponse.json({ ok: true }, { status: 200 })
}
