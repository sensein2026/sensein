import { sendSuccess, sendError } from '../utils/responseEnvelope.js'

// In-memory idempotency cache with 24-hour expiration window
const idempotencyStore = new Map()

// Clean up expired keys every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of idempotencyStore.entries()) {
    if (record.expiresAt < now) {
      idempotencyStore.delete(key)
    }
  }
}, 30 * 60 * 1000)

/**
 * Middleware to enforce idempotency on state-changing endpoints.
 * Checks for `Idempotency-Key` header. If provided and already processed within TTL,
 * immediately replays the cached response.
 */
export const requireIdempotency = (ttlMinutes = 1440) => {
  return (req, res, next) => {
    const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key']

    if (!key) {
      // If no idempotency key is passed, proceed normally
      return next()
    }

    const cacheKey = `${req.method}:${req.baseUrl}${req.path}:${key}`
    const existing = idempotencyStore.get(cacheKey)

    if (existing) {
      if (existing.status === 'PENDING') {
        return sendError(
          res,
          'A request with this Idempotency-Key is currently being processed. Please retry shortly.',
          409,
          'IDEMPOTENCY_IN_PROGRESS'
        )
      }

      // Replay stored response
      return res.status(existing.statusCode).json(existing.body)
    }

    // Mark as pending
    idempotencyStore.set(cacheKey, {
      status: 'PENDING',
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    })

    // Intercept response to store result
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      idempotencyStore.set(cacheKey, {
        status: 'COMPLETED',
        statusCode: res.statusCode,
        body,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      })
      return originalJson(body)
    }

    next()
  }
}
