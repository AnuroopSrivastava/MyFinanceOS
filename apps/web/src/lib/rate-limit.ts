// Sliding-window rate limiter guarding the unauthenticated auth endpoints
// (/api/auth/forgot-password, /api/auth/login).
//
// Defense model: Vercel Firewall edge rules (vercel.json) are the first layer;
// this in-memory limiter is the second, checked before any Supabase or email
// work so a flood is rejected cheaply. Serverless instances are short-lived,
// making this store per-instance; it is the authoritative limiter for
// `next start` self-hosted deployments. No raw IPs or emails ever leave the
// process — per-email keys use a truncated SHA-256 of the address.

import { createHash } from 'node:crypto'

export interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
  remaining: number
}

const HOUR = 60 * 60 * 1000

export const AUTH_RATE_LIMITS = {
  // Per-IP limits slow a single-source flood; per-email limits stop email
  // bombing of a specific victim and slow distributed credential stuffing.
  forgotPassword: {
    ip: { limit: 5, windowMs: 1 * HOUR },
    email: { limit: 3, windowMs: 24 * HOUR },
  },
  login: {
    ip: { limit: 30, windowMs: 15 * 60 * 1000 },
    email: { limit: 10, windowMs: 15 * 60 * 1000 },
  },
} as const

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

// Privacy-safe stable identifier for rate-limit keys and telemetry — raw
// addresses are never used as keys or event properties.
export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>()
  private opsSincePrune = 0

  constructor(
    private readonly maxKeys = 50_000,
    private readonly clock: () => number = () => Date.now(),
    private readonly pruneEvery = 1000,
  ) {}

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = this.clock()
    let bucket = this.hits.get(key)
    if (!bucket) {
      bucket = []
      this.hits.set(key, bucket)
    }
    const cutoff = now - windowMs
    while (bucket.length > 0 && bucket[0] <= cutoff) bucket.shift()

    if (bucket.length >= limit) {
      const retryAfterMs = bucket[0] + windowMs - now
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        remaining: 0,
      }
    }
    bucket.push(now)

    // Periodic sweep keeps the map bounded under floods that forge unique keys.
    if (++this.opsSincePrune >= this.pruneEvery) {
      this.opsSincePrune = 0
      this.prune(now)
    }
    return { ok: true, retryAfterSec: 0, remaining: limit - bucket.length }
  }

  private prune(now: number): void {
    const staleCutoff = now - 24 * HOUR
    for (const [key, bucket] of this.hits) {
      if (bucket.length === 0 || bucket[bucket.length - 1] <= staleCutoff) {
        this.hits.delete(key)
      }
    }
    if (this.hits.size > this.maxKeys) {
      const excess = this.hits.size - this.maxKeys
      let removed = 0
      for (const key of this.hits.keys()) {
        this.hits.delete(key)
        if (++removed >= excess) break
      }
    }
  }
}

export const authRateLimiter = new SlidingWindowRateLimiter()
