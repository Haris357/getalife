// Simple in-memory rate limiter — resets on cold start
// For production scale, swap the store for Redis / Upstash

const store = new Map<string, { count: number; resetAt: number }>()

interface Options {
  key: string        // unique key per user/action (e.g. userId + route)
  limit: number      // max requests allowed
  windowMs: number   // window duration in ms
}

export function checkRateLimit(opts: Options): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(opts.key)

  if (!entry || now > entry.resetAt) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.limit - 1 }
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: opts.limit - entry.count }
}
