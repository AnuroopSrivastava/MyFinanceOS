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

// Unauthenticated credential endpoint: limiter checks run before any
// Supabase call so stuffing attempts are rejected cheaply.
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let email: string | undefined
  let password: string | undefined
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : undefined
    password = typeof body?.password === 'string' ? body.password : undefined
  } catch {
    return invalidCredentials()
  }

  if (!email || !EMAIL_REGEX.test(email) || !password) {
    return invalidCredentials()
  }

  const ip = getClientIp(request)
  const emailHash = hashIdentifier(email)
  const { login } = AUTH_RATE_LIMITS

  const ipLimit = authRateLimiter.check(`login:ip:${ip}`, login.ip.limit, login.ip.windowMs)
  const emailLimit = authRateLimiter.check(
    `login:email:${emailHash}`,
    login.email.limit,
    login.email.windowMs,
  )

  if (!ipLimit.ok || !emailLimit.ok) {
    const retryAfterSec = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec)
    await captureSecurityEvent('password_login_rate_limited', {
      email_hash: emailHash,
      scope: !ipLimit.ok ? 'ip' : 'email',
    })
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }

  const cookieStore = await cookies()
  const response = NextResponse.json({ ok: true }, { status: 200 })
  const supabase = createSupabaseRouteClient(cookieStore, response)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('Password sign-in error:', error.message)
    await captureSecurityEvent('password_login_failed', { email_hash: emailHash })
    return invalidCredentials()
  }

  await captureSecurityEvent('password_login_succeeded', { email_hash: emailHash })
  return response
}

// Identical shape and status for every failure — never reveal whether the
// account exists or which part of the credential pair was wrong.
function invalidCredentials() {
  return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
}
