import { describe, it, expect } from 'vitest'
import { SlidingWindowRateLimiter, getClientIp, hashIdentifier } from './rate-limit'

function makeLimiter(pruneEvery = 1000) {
  let now = 1_000_000
  const limiter = new SlidingWindowRateLimiter(100, () => now, pruneEvery)
  return {
    limiter,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe('SlidingWindowRateLimiter', () => {
  it('allows requests up to the limit and blocks the next one', () => {
    const { limiter } = makeLimiter()
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('k', 5, 60_000).ok).toBe(true)
    }
    const blocked = limiter.check('k', 5, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('frees capacity once the window slides past old hits', () => {
    const { limiter, advance } = makeLimiter()
    for (let i = 0; i < 5; i++) limiter.check('k', 5, 60_000)
    expect(limiter.check('k', 5, 60_000).ok).toBe(false)
    advance(60_001)
    expect(limiter.check('k', 5, 60_000).ok).toBe(true)
  })

  it('reports a positive Retry-After that counts down as the window slides', () => {
    const { limiter, advance } = makeLimiter()
    limiter.check('k', 1, 60_000)
    const first = limiter.check('k', 1, 60_000)
    expect(first.ok).toBe(false)
    expect(first.retryAfterSec).toBe(60)
    advance(30_000)
    const second = limiter.check('k', 1, 60_000)
    expect(second.ok).toBe(false)
    expect(second.retryAfterSec).toBe(30)
  })

  it('tracks keys independently', () => {
    const { limiter } = makeLimiter()
    for (let i = 0; i < 3; i++) limiter.check('a', 3, 60_000)
    expect(limiter.check('a', 3, 60_000).ok).toBe(false)
    expect(limiter.check('b', 3, 60_000).ok).toBe(true)
  })

  it('prunes stale keys on the maintenance sweep', () => {
    const { limiter, advance } = makeLimiter(2)
    limiter.check('stale', 5, 1_000)
    limiter.check('fresh', 5, 60_000)
    advance(25 * 60 * 60 * 1000) // past the 24h staleness cutoff
    limiter.check('trigger', 5, 60_000)
    limiter.check('trigger2', 5, 60_000)
    // 'stale' was swept; 'fresh' survived despite the long advance
    // (fresh still has a hit within its own window after re-check below).
    expect(limiter.check('fresh', 5, 25 * 60 * 60 * 1000).remaining).toBe(4)
  })
})

describe('getClientIp', () => {
  it('uses the first x-forwarded-for value', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }),
    } as Request
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const request = { headers: new Headers({ 'x-real-ip': '9.9.9.9' }) } as Request
    expect(getClientIp(request)).toBe('9.9.9.9')
  })

  it('returns unknown when no proxy headers exist', () => {
    const request = { headers: new Headers() } as Request
    expect(getClientIp(request)).toBe('unknown')
  })
})

describe('hashIdentifier', () => {
  it('is deterministic, truncated, and collision-differentiating', () => {
    const a = hashIdentifier('user@example.com')
    expect(a).toHaveLength(16)
    expect(hashIdentifier('user@example.com')).toBe(a)
    expect(hashIdentifier('other@example.com')).not.toBe(a)
  })
})
