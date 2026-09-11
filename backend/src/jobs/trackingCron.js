import Order from '../models/Order.js'
import Replacement from '../models/Replacement.js'
import { trackShipment } from '../services/delhiveryService.js'
import { logger } from '../config/logger.js'

let isTrackingCronRunning = false

/**
 * Poll all active waybills with non-terminal status and update their timeline
 */
export async function runTrackingSync() {
  if (isTrackingCronRunning) {
    logger.info('Tracking sync already in progress, skipping overlapping run')
    return
  }

  isTrackingCronRunning = true
  try {
    // 1. Sync Active Orders
    const activeOrders = await Order.find({
      waybill: { $exists: true, $ne: null },
      orderStatus: { $in: ['SHIPPED', 'PACKED', 'OUT_FOR_DELIVERY', 'NDR_PENDING', 'RTO_INITIATED', 'RTO_IN_TRANSIT'] },
    }).limit(50)

    for (const order of activeOrders) {
      try {
        const tracking = await trackShipment(order.waybill)
        if (tracking.success && tracking.normalizedStatus) {
          if (tracking.normalizedStatus !== order.orderStatus) {
            order.orderStatus = tracking.normalizedStatus
            if (tracking.normalizedStatus === 'DELIVERED') {
              order.deliveredAt = new Date()
              order.fulfillmentStatus = 'DELIVERED'
              if (order.paymentMethod === 'COD' && order.collectionStatus === 'PENDING') {
                order.collectionStatus = 'COLLECTED'
                order.codCollectedAt = new Date()
              }
            }
            order.timeline.push({
              status: tracking.normalizedStatus,
              note: `Status updated via Delhivery tracking poll: ${tracking.rawStatus}`,
              location: tracking.scans?.[0]?.location || 'Courier Transit',
              source: 'DELHIVERY',
              actor: 'Tracking Cron',
              actorType: 'SYSTEM',
              at: new Date(),
            })
            await order.save()
            logger.info({ orderNumber: order.orderNumber, status: tracking.normalizedStatus }, 'Tracking cron updated order')
          }
        }
      } catch (orderErr) {
        logger.warn({ orderNumber: order.orderNumber, err: orderErr.message }, 'Failed to sync tracking for order')
      }
    }

    // 2. Sync Active Replacements (Reverse and Forward waybills)
    const activeReplacements = await Replacement.find({
      status: {
        $in: [
          'REVERSE_PICKUP_SCHEDULED',
          'REVERSE_PICKUP_PICKED',
          'REVERSE_IN_TRANSIT',
          'REPLACEMENT_SHIPPED',
          'REPLACEMENT_OUT_FOR_DELIVERY',
        ],
      },
    }).limit(30)

    for (const rep of activeReplacements) {
      try {
        const waybillToTrack = rep.replacementWaybill || rep.reverseWaybill
        if (waybillToTrack) {
          const tracking = await trackShipment(waybillToTrack)
          if (tracking.success && tracking.normalizedStatus) {
            // Update replacement status if milestone reached
            if (rep.status.startsWith('REVERSE_') && tracking.rawStatus.includes('DELIVERED')) {
              rep.status = 'REVERSE_RECEIVED_AT_WAREHOUSE'
              rep.timeline.push({
                status: 'REVERSE_RECEIVED_AT_WAREHOUSE',
                note: 'Reverse pickup package received at warehouse. QC inspection pending.',
                source: 'DELHIVERY',
                actor: 'Tracking Cron',
                actorType: 'SYSTEM',
              })
              await rep.save()
            } else if (rep.status.startsWith('REPLACEMENT_') && tracking.normalizedStatus === 'DELIVERED') {
              rep.status = 'REPLACEMENT_DELIVERED'
              rep.timeline.push({
                status: 'REPLACEMENT_DELIVERED',
                note: 'Replacement product delivered to customer.',
                source: 'DELHIVERY',
                actor: 'Tracking Cron',
                actorType: 'SYSTEM',
              })
              await rep.save()
            }
          }
        }
      } catch (repErr) {
        logger.warn({ repId: rep._id, err: repErr.message }, 'Failed to sync tracking for replacement')
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Error during tracking sync cron job')
  } finally {
    isTrackingCronRunning = false
  }
}

/**
 * Initialize Tracking Cron Job
 */
export function initTrackingCron(intervalMinutes = 20) {
  const intervalMs = intervalMinutes * 60 * 1000
  setInterval(() => {
    runTrackingSync().catch((e) => logger.error({ err: e.message }, 'Tracking cron uncaught error'))
  }, intervalMs)
  logger.info(`Tracking sync cron scheduled to run every ${intervalMinutes} minutes`)
}
