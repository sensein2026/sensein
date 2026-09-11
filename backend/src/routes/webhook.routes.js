import { Router } from 'express'
import Order from '../models/Order.js'
import ProcessedWebhookEvent from '../models/ProcessedWebhookEvent.js'
import { handleRazorpayWebhook } from '../controllers/payment.controller.js'
import { DELHIVERY_STATUS_MAP } from '../services/delhiveryService.js'
import { logger } from '../config/logger.js'

const router = Router()

/**
 * Razorpay Webhook Endpoint
 * POST /api/webhooks/razorpay
 */
router.post('/razorpay', handleRazorpayWebhook)

/**
 * Delhivery Courier Webhook Endpoint (Idempotent via ProcessedWebhookEvent)
 * POST /api/webhooks/delhivery
 */
router.post('/delhivery', async (req, res, next) => {
  try {
    const payload = req.body
    logger.info({ payload }, 'Delhivery webhook notification received')

    const orderId = payload.order_id || payload.orderNumber || payload.orderId
    const awb = payload.awb || payload.waybill || payload.awb_number || payload.awbNumber
    const incomingStatus = (payload.status || payload.event || '').toUpperCase().trim()
    const location = payload.location || payload.city || 'Transit Center'
    const description = payload.description || payload.message || `Shipment status: ${incomingStatus}`
    const eventId = payload.event_id || payload.scans?.[0]?.scan_id || `${awb}-${incomingStatus}-${Date.now()}`

    if (!orderId && !awb) {
      return res.status(200).json({ success: false, message: 'Missing order_id or waybill' })
    }

    // Database-Level Idempotency Check
    try {
      await ProcessedWebhookEvent.create({
        provider: 'delhivery',
        eventId,
        payloadSummary: { awb, incomingStatus, location },
      })
    } catch (err) {
      if (err.code === 11000) {
        logger.info({ eventId }, 'Duplicate Delhivery webhook skipped')
        return res.status(200).json({ success: true, message: 'Event already processed' })
      }
      throw err
    }

    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { waybill: awb },
        { trackingNumber: awb },
        { 'delhivery.waybill': awb },
      ],
    })

    if (!order) {
      logger.warn({ orderId, awb }, 'Order not found for Delhivery webhook')
      return res.status(200).json({ success: false, message: 'Order not found' })
    }

    const mapped = DELHIVERY_STATUS_MAP[incomingStatus] || { orderStatus: 'SHIPPED', fulfillmentStatus: 'IN_TRANSIT' }

    order.orderStatus = mapped.orderStatus || order.orderStatus
    order.fulfillmentStatus = mapped.fulfillmentStatus || order.fulfillmentStatus

    if (incomingStatus.includes('DELIVERED') || mapped.orderStatus === 'DELIVERED') {
      order.deliveredAt = new Date()
      if (order.paymentMethod === 'COD' && order.collectionStatus === 'PENDING') {
        order.collectionStatus = 'COLLECTED'
        order.codCollectedAt = new Date()
      }
    }

    order.timeline.push({
      status: mapped.orderStatus || incomingStatus,
      note: description,
      location,
      source: 'DELHIVERY',
      actor: 'Delhivery Webhook',
      actorType: 'COURIER',
      externalEventId: eventId,
      at: new Date(),
    })

    await order.save()

    return res.status(200).json({
      success: true,
      message: 'Delhivery webhook processed successfully',
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'Delhivery webhook handler error')
    return res.status(200).json({ success: false, message: error.message })
  }
})

export default router
