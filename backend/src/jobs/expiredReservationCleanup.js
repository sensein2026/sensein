import StockReservation from '../models/StockReservation.js'
import Product from '../models/Product.js'
import { logger } from '../config/logger.js'

let isCleanupRunning = false

/**
 * Scan and release expired StockReservations
 */
export async function cleanupExpiredReservations() {
  if (isCleanupRunning) return
  isCleanupRunning = true

  try {
    const now = new Date()
    const expiredReservations = await StockReservation.find({
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    }).limit(100)

    if (expiredReservations.length === 0) {
      isCleanupRunning = false
      return
    }

    logger.info({ count: expiredReservations.length }, 'Found expired stock reservations to release')

    for (const res of expiredReservations) {
      try {
        for (const item of res.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { reservedStock: -item.quantity },
          }).catch((err) => logger.warn({ err: err.message }, 'Failed to decrement reserved stock during cleanup'))
        }

        res.status = 'EXPIRED'
        res.releasedAt = now
        await res.save()
      } catch (itemErr) {
        logger.error({ resId: res._id, err: itemErr.message }, 'Error cleaning up single reservation')
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Error running expired reservation cleanup job')
  } finally {
    isCleanupRunning = false
  }
}

/**
 * Initialize Reservation Cleanup Job
 */
export function initExpiredReservationCleanup(intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000
  setInterval(() => {
    cleanupExpiredReservations().catch((e) => logger.error({ err: e.message }, 'Reservation cleanup uncaught error'))
  }, intervalMs)
  logger.info(`Expired stock reservation cleanup job scheduled every ${intervalMinutes} minutes`)
}
