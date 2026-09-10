import { Router } from 'express'
import Order from '../models/Order.js'
import Shipment from '../models/Shipment.js'
import { transitionOrderStatus } from '../services/orderStatusEngine.js'
import { logger } from '../config/logger.js'

const router = Router()

/**
 * Delhivery & Courier Webhook Endpoint (Idempotent & Multi-status aware)
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
    const externalEventId = payload.event_id || payload.scans?.[0]?.scan_id || `${awb}-${incomingStatus}-${Date.now()}`

    if (!orderId && !awb) {
      return res.status(400).json({ success: false, message: 'Missing order_id or waybill/awb in webhook payload' })
    }

    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { trackingNumber: awb },
        { 'delhivery.waybill': awb },
      ],
    }).populate('activeShipment')

    if (!order) {
      logger.warn({ orderId, awb }, 'Order not found for Delhivery webhook event')
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Idempotency: check if this external event was already recorded in order timeline
    const alreadyProcessed = order.timeline?.some((t) => t.externalEventId === externalEventId)
    if (alreadyProcessed) {
      logger.info({ orderNumber: order.orderNumber, externalEventId }, 'Duplicate webhook event skipped')
      return res.status(200).json({ success: true, message: 'Event already processed' })
    }

    // Map Courier Status to Separated Lifecycle States
    let targetFulfillment = order.fulfillmentStatus
    let targetOrderStatus = order.orderStatus
    let targetPaymentStatus = order.paymentStatus
    let targetCodStatus = order.codCollectionStatus
    let targetRtoStatus = order.rtoStatus

    if (incomingStatus.includes('DELIVERED')) {
      targetFulfillment = 'DELIVERED'
      if (order.paymentMethod === 'COD') {
        // If COD courier confirmation indicates cash received
        targetCodStatus = 'COLLECTED'
        targetPaymentStatus = 'PAID'
        order.codCollectedAt = new Date()
      }
      targetOrderStatus = 'ACTIVE'
    } else if (incomingStatus.includes('OUT_FOR_DELIVERY') || incomingStatus.includes('OFD')) {
      targetFulfillment = 'OUT_FOR_DELIVERY'
    } else if (incomingStatus.includes('IN_TRANSIT') || incomingStatus.includes('REACHED') || incomingStatus.includes('TRANSIT')) {
      targetFulfillment = 'IN_TRANSIT'
    } else if (incomingStatus.includes('PICKED_UP') || incomingStatus.includes('PICKED') || incomingStatus.includes('INVOICED')) {
      targetFulfillment = 'PICKED_UP'
    } else if (incomingStatus.includes('MANIFEST') || incomingStatus.includes('BOOKED')) {
      targetFulfillment = 'READY_FOR_PICKUP'
    } else if (incomingStatus.includes('RTO') || incomingStatus.includes('RETURN')) {
      targetOrderStatus = 'RTO'
      targetRtoStatus = incomingStatus.includes('DELIVERED') ? 'DELIVERED' : 'IN_TRANSIT'
    }

    // Update active shipment if linked
    if (order.activeShipment) {
      order.activeShipment.status = targetFulfillment
      if (targetFulfillment === 'PICKED_UP') order.activeShipment.pickedUpAt = new Date()
      if (targetFulfillment === 'DELIVERED') order.activeShipment.deliveredAt = new Date()
      if (!Array.isArray(order.activeShipment.webhookEvents)) order.activeShipment.webhookEvents = []
      order.activeShipment.webhookEvents.push({
        receivedAt: new Date(),
        event: incomingStatus,
        status: targetFulfillment,
        location,
        description,
        raw: payload,
      })
      await order.activeShipment.save().catch(() => {})
    }

    await transitionOrderStatus(
      order,
      {
        orderStatus: targetOrderStatus,
        fulfillmentStatus: targetFulfillment,
        paymentStatus: targetPaymentStatus,
        codCollectionStatus: targetCodStatus,
        rtoStatus: targetRtoStatus,
      },
      {
        actor: 'Delhivery Webhook',
        actorType: 'COURIER',
        reason: description,
        source: 'DELHIVERY_WEBHOOK',
        externalEventId,
        metadata: { location, incomingStatus },
      }
    )

    logger.info({ orderNumber: order.orderNumber, fulfillment: targetFulfillment }, 'Delhivery webhook applied successfully')

    res.json({
      success: true,
      message: 'Webhook event processed successfully',
      orderNumber: order.orderNumber,
      fulfillmentStatus: targetFulfillment,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'Webhook handler error')
    next(error)
  }
})

export default router
