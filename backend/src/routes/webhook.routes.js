import { Router } from 'express'
import Order from '../models/Order.js'
import { logger } from '../config/logger.js'

const router = Router()

/**
 * Shipway Webhook Endpoint
 * POST /api/webhooks/shipway
 */
router.post('/shipway', async (req, res, next) => {
  try {
    const payload = req.body
    logger.info({ payload }, 'Shipway webhook notification received')

    const orderId = payload.order_id || payload.orderNumber || payload.orderId
    const awb = payload.awb || payload.awb_number || payload.awbNumber
    const incomingStatus = (payload.status || payload.event || '').toUpperCase().trim()
    const location = payload.location || payload.city || 'Transit Center'
    const description = payload.description || payload.message || `Shipment status updated to ${incomingStatus}`

    if (!orderId && !awb) {
      return res.status(400).json({ success: false, message: 'Missing order_id or awb in webhook payload' })
    }

    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { trackingNumber: awb },
        { 'shipway.awbNumber': awb },
      ],
    })

    if (!order) {
      logger.warn({ orderId, awb }, 'Order not found for Shipway webhook event')
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Map Shipway Status to Standard Sensein Order Status
    let mappedStatus = order.orderStatus
    let eventTitle = `Shipment update: ${incomingStatus}`

    if (incomingStatus.includes('DELIVERED')) {
      mappedStatus = 'DELIVERED'
      eventTitle = 'Delivered to Recipient'
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'PAID'
      }
    } else if (incomingStatus.includes('OUT_FOR_DELIVERY') || incomingStatus.includes('OUT FOR DELIVERY')) {
      mappedStatus = 'OUT_FOR_DELIVERY'
      eventTitle = 'Out for Doorstep Delivery'
    } else if (incomingStatus.includes('IN_TRANSIT') || incomingStatus.includes('IN TRANSIT') || incomingStatus.includes('REACHED')) {
      mappedStatus = 'IN_TRANSIT'
      eventTitle = 'In Transit to Destination'
    } else if (incomingStatus.includes('SHIPPED') || incomingStatus.includes('PICKED') || incomingStatus.includes('DISPATCHED')) {
      mappedStatus = 'SHIPPED'
      eventTitle = `Dispatched via ${order.courierPartner || 'Courier'}`
    } else if (incomingStatus.includes('RTO') || incomingStatus.includes('RETURN')) {
      mappedStatus = 'RTO'
      eventTitle = 'Returned to Origin'
    }

    order.orderStatus = mappedStatus
    if (order.shipway) {
      order.shipway.status = mappedStatus
    }

    order.trackingHistory.push({
      status: mappedStatus,
      title: eventTitle,
      location,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      description,
    })

    await order.save()

    logger.info({ orderNumber: order.orderNumber, status: mappedStatus }, 'Shipway webhook applied to order')

    res.json({
      success: true,
      message: 'Shipway webhook event processed successfully',
      orderNumber: order.orderNumber,
      status: mappedStatus,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'Shipway webhook handler exception')
    next(error)
  }
})

export default router
