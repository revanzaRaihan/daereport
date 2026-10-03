interface RateLimitRecord {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Interval pembersihan memori otomatis untuk menghapus entri usang
const CLEANUP_INTERVAL_MS = 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter(ts => ts > cutoff)
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetMs: number
}

export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const limit = options.limit ?? 10
  const windowMs = options.windowMs ?? 60_000
  const now = Date.now()
  const cutoff = now - windowMs

  cleanupExpired(windowMs)

  let record = rateLimitStore.get(key)
  if (!record) {
    record = { timestamps: [] }
    rateLimitStore.set(key, record)
  }

  record.timestamps = record.timestamps.filter(ts => ts > cutoff)

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0]
    const resetMs = Math.max(0, oldest + windowMs - now)
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs
    }
  }

  record.timestamps.push(now)
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs
  }
}
