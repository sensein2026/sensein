import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import { pushOrderToDelhivery } from '../utils/delhivery.js'
import { logger } from '../config/logger.js'

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TXRfNUNgeY6NAa'
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mLd6syLkVLXZCsmRaTm7fuA1'
  if (key_id && key_secret && !key_id.includes('xxxx') && !key_secret.includes('xxxx')) {
    try {
      return new Razorpay({ key_id, key_secret })
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to initialize Razorpay instance')
    }
  }
  return null
}

/**
 * 1. Create Razorpay Payment Order
 * POST /api/create-order or POST /api/payment/create
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, amount, currency = 'INR', receipt, notes } = req.body

    let order = null
    if (orderId) {
      order = await Order.findOne({
        $or: [
          { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
        ],
      })
    }

    if (order && order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'This order has already been paid for' })
    }

    // Determine amount in paise
    let amountInPaise
    if (order) {
      amountInPaise = Math.round(Number(order.totalAmount) * 100)
    } else if (amount !== undefined && amount !== null) {
      amountInPaise = Math.round(Number(amount))
    }

    // Minimum amount validation: at least 100 paise (₹1)
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount must be at least 100 paise (₹1.00).',
      })
    }

    const orderReceipt = receipt || (order ? String(order.orderNumber) : `rcpt_${Date.now().toString().slice(-10)}`)
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TXRfNUNgeY6NAa'
    const razorpayInstance = getRazorpayInstance()

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay payment gateway is not properly configured on server.',
      })
    }

    try {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: orderReceipt,
        notes: notes || {
          orderId: order ? order._id.toString() : '',
          orderNumber: order ? order.orderNumber : '',
        },
      })

      if (order) {
        order.paymentDetails.razorpayOrderId = razorpayOrder.id
        await order.save()
      }

      return res.status(200).json({
        success: true,
        order_id: razorpayOrder.id,
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: razorpayKeyId,
        key_id: razorpayKeyId,
        data: razorpayOrder,
        order: order
          ? {
              _id: order._id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
            }
          : undefined,
      })
    } catch (razorpayErr) {
      logger.error({ err: razorpayErr }, 'Razorpay API Order creation error')
      
      // Handle authentication or permission errors from Razorpay API
      if (razorpayErr.statusCode === 401 || razorpayErr?.error?.code === 'BAD_REQUEST_ERROR_AUTH') {
        return res.status(401).json({
          success: false,
          message: 'Razorpay authentication failed: Invalid API credentials.',
          error: razorpayErr.error || razorpayErr.message,
        })
      }

      return res.status(razorpayErr.statusCode || 500).json({
        success: false,
        message: razorpayErr?.error?.description || razorpayErr.message || 'Razorpay order creation failed',
        error: razorpayErr.error || razorpayErr.message,
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * 2. Verify Razorpay Payment Signature
 * POST /api/verify-payment or POST /api/payment/verify
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      order_id,
      razorpay_payment_id,
      payment_id,
      razorpay_signature,
      signature,
      paymentMethod = 'ONLINE',
    } = req.body

    const activeOrderId = razorpay_order_id || order_id
    const activePaymentId = razorpay_payment_id || payment_id
    const activeSignature = razorpay_signature || signature

    // Validate required fields
    if (!activeOrderId || !activePaymentId || !activeSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, payment_id, and signature are required for verification.',
      })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mLd6syLkVLXZCsmRaTm7fuA1'
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay Key Secret is not configured on server.',
      })
    }

    // HMAC-SHA256 signature calculation: order_id + "|" + payment_id
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${activeOrderId}|${activePaymentId}`)
      .digest('hex')

    // Strict signature comparison
    if (generatedSignature !== activeSignature) {
      logger.warn(
        { activeOrderId, activePaymentId, receivedSignature: activeSignature },
        'Razorpay signature verification failed: signature mismatch'
      )
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature. Transaction cannot be verified.',
      })
    }

    // Find the corresponding Order in database if applicable
    let order = null
    if (orderId) {
      order = await Order.findOne({
        $or: [
          { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
          { 'paymentDetails.razorpayOrderId': activeOrderId },
        ],
      })
    } else {
      order = await Order.findOne({ 'paymentDetails.razorpayOrderId': activeOrderId })
    }

    if (order) {
      // 1. Update Payment Status to PAID. orderStatus stays PENDING until manually dispatched by Admin (unless Auto-Ship is ON)
      order.paymentStatus = 'PAID'
      order.orderStatus = 'PENDING'
      order.paymentDetails.gateway = 'Razorpay'
      order.paymentDetails.razorpayOrderId = activeOrderId
      order.paymentDetails.razorpayPaymentId = activePaymentId
      order.paymentDetails.razorpaySignature = activeSignature
      order.paymentDetails.transactionId = activePaymentId
      order.paymentDetails.paidAt = new Date()

      // 2. Dynamic Auto-Ship Switch: If Admin has enabled Auto-Ship Mode, automatically book in Delhivery and mark SHIPPED
      try {
        const ShippingConfig = (await import('../models/ShippingConfig.js')).default
        const shippingConfig = await ShippingConfig.findOne()

        if (shippingConfig && shippingConfig.isAutoShipEnabled) {
          const delhiveryResult = await pushOrderToDelhivery({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod || paymentMethod,
          })

          if (delhiveryResult && (delhiveryResult.success || delhiveryResult.waybill)) {
            order.delhivery = {
              waybill: delhiveryResult.waybill,
              shipmentId: delhiveryResult.waybill,
              courierName: delhiveryResult.courier || 'Delhivery Surface & Express B2C',
              trackingUrl: delhiveryResult.trackingUrl || `https://www.delhivery.com/track/package/${delhiveryResult.waybill}`,
              status: 'SHIPPED',
              assignmentStatus: 'ASSIGNED',
              statusMessage: 'Manifested with Delhivery',
            }
            order.trackingNumber = delhiveryResult.waybill
            order.courierPartner = delhiveryResult.courier || 'Delhivery Surface & Express'
            order.orderStatus = 'SHIPPED'
          }
        }
      } catch (autoShipErr) {
        logger.warn({ err: autoShipErr.message }, 'Auto-shipment check/booking skipped')
      }

      // Milestone Tracking Checkpoints
      const existingCheckpoints = order.trackingHistory || []
      const now = new Date()

      if (!existingCheckpoints.some((c) => c.status === 'PLACED')) {
        existingCheckpoints.push({
          status: 'PLACED',
          title: 'Order Placed',
          location: 'Sensein Digital Flagship',
          timestamp: order.createdAt || now,
          description: `Order ${order.orderNumber} successfully registered in system.`,
        })
      }

      existingCheckpoints.push({
        status: order.orderStatus === 'SHIPPED' ? 'SHIPPED' : 'PENDING',
        title:
          order.orderStatus === 'SHIPPED'
            ? `Dispatched via ${order.courierPartner || 'Delhivery Express'}`
            : 'Payment Verified (Awaiting Dispatch)',
        location: 'Sensein Central Operations',
        timestamp: now,
        description:
          order.orderStatus === 'SHIPPED'
            ? `Delhivery Waybill #${order.trackingNumber} generated. Package in transit.`
            : `Payment of ₹${order.totalAmount?.toLocaleString('en-IN')} verified. Order queued for dispatch.`,
      })

      order.trackingHistory = existingCheckpoints
      await order.save()

      logger.info(
        { orderNumber: order.orderNumber, activePaymentId, awb: order.trackingNumber },
        'Payment verified & order confirmed successfully'
      )

      return res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        order_id: activeOrderId,
        payment_id: activePaymentId,
        data: order,
      })
    }

    // Direct standalone payment verification success response
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: activeOrderId,
      payment_id: activePaymentId,
      verified: true,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 3. Handle Payment Failure (Retry enabled)
 * POST /api/payment/failed
 */
export const paymentFailed = async (req, res, next) => {
  try {
    const { orderId, errorDescription, errorCode } = req.body

    let order = null
    if (orderId) {
      order = await Order.findOne({
        $or: [
          { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
        ],
      })
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    order.paymentStatus = 'FAILED'
    order.orderStatus = 'PAYMENT_FAILED'

    const failureDesc = errorDescription || 'Payment declined or cancelled by customer.'
    order.trackingHistory.push({
      status: 'PAYMENT_FAILED',
      title: 'Payment Attempt Failed',
      location: 'Razorpay Payment Gateway',
      timestamp: new Date(),
      description: `${failureDesc} Customer can retry payment.`,
    })

    await order.save()

    res.json({
      success: true,
      message: 'Order status updated to Payment Failed. Retry payment is available.',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}
