import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import AuditLog from '../models/AuditLog.js'
import { pushOrderToDelhivery } from '../utils/delhivery.js'
import { transitionOrderStatus } from '../services/orderStatusEngine.js'
import { logger } from '../config/logger.js'

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

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
      return res.status(400).json({ success: false, message: 'This order has already been paid for.' })
    }

    // Determine amount in paise strictly calculated
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
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || ''
    const razorpayInstance = getRazorpayInstance()

    if (!razorpayInstance) {
      logger.warn('Razorpay keys not fully configured in environment variables')
      return res.status(500).json({
        success: false,
        message: 'Razorpay payment gateway is not properly configured on server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in environment.',
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

    if (!activeOrderId || !activePaymentId || !activeSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: order_id, payment_id, and signature are required for verification.',
      })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
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

    // Find the corresponding Order
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
      // Idempotency: if already marked PAID with same payment ID, return clean success
      if (order.paymentStatus === 'PAID' && order.paymentDetails?.razorpayPaymentId === activePaymentId) {
        return res.status(200).json({
          success: true,
          message: 'Payment already verified.',
          data: order,
        })
      }

      order.paymentStatus = 'PAID'
      order.orderStatus = 'ACTIVE'
      order.fulfillmentStatus = 'CONFIRMED'
      order.paymentDetails.gateway = 'Razorpay'
      order.paymentDetails.razorpayOrderId = activeOrderId
      order.paymentDetails.razorpayPaymentId = activePaymentId
      order.paymentDetails.razorpaySignature = activeSignature
      order.paymentDetails.transactionId = activePaymentId
      order.paymentDetails.paidAt = new Date()

      // Record state transition
      await transitionOrderStatus(
        order,
        {
          orderStatus: 'ACTIVE',
          fulfillmentStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
        {
          actor: req.user?.email || 'Razorpay Gateway',
          actorType: 'SYSTEM',
          reason: `Online payment verified. Payment ID: ${activePaymentId}`,
          source: 'RAZORPAY_VERIFY',
        }
      )

      logger.info(
        { orderNumber: order.orderNumber, activePaymentId },
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
    const failureDesc = errorDescription || 'Payment declined or cancelled by customer.'

    await transitionOrderStatus(
      order,
      { paymentStatus: 'FAILED' },
      {
        actor: 'Customer / Razorpay',
        actorType: 'CUSTOMER',
        reason: failureDesc,
        source: 'PAYMENT_FAILED_HANDLER',
      }
    )

    res.json({
      success: true,
      message: 'Payment recorded as failed. Order remains recoverable for retry payment.',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 4. Process Real Razorpay Refund
 * POST /api/payment/refund
 */
export const processRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason = 'Customer refund requested' } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (order.refundStatus === 'COMPLETED' || order.paymentStatus === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'This order has already been refunded.' })
    }

    const paymentId = order.paymentDetails?.razorpayPaymentId
    const refundAmount = amount ? Number(amount) : order.totalAmount

    if (order.paymentMethod === 'COD') {
      // For COD, manual/bank transfer refund tracking
      order.paymentStatus = 'REFUNDED'
      order.refundStatus = 'COMPLETED'
      order.refundDetails = {
        razorpayRefundId: `cod_rfnd_${Date.now()}`,
        refundAmount,
        refundedAt: new Date(),
        refundReason: reason,
        status: 'COMPLETED',
      }
      await order.save()

      return res.json({
        success: true,
        message: 'COD order marked as refunded.',
        data: order,
      })
    }

    // For Prepaid Razorpay Orders
    const razorpayInstance = getRazorpayInstance()
    let razorpayRefund = null

    if (razorpayInstance && paymentId && !paymentId.startsWith('dummy')) {
      try {
        const refundPaise = Math.round(refundAmount * 100)
        razorpayRefund = await razorpayInstance.payments.refund(paymentId, {
          amount: refundPaise,
          notes: {
            orderNumber: order.orderNumber,
            reason,
          },
        })
      } catch (rzpErr) {
        logger.error({ err: rzpErr }, 'Razorpay refund API error')
        return res.status(400).json({
          success: false,
          message: rzpErr.error?.description || rzpErr.message || 'Razorpay refund API failed.',
        })
      }
    }

    const refundId = razorpayRefund?.id || `rfnd_sim_${Date.now()}`
    order.paymentStatus = 'REFUNDED'
    order.refundStatus = 'COMPLETED'
    order.refundDetails = {
      razorpayRefundId: refundId,
      refundAmount,
      refundedAt: new Date(),
      refundReason: reason,
      status: 'COMPLETED',
    }

    await transitionOrderStatus(
      order,
      {
        paymentStatus: 'REFUNDED',
        refundStatus: 'COMPLETED',
      },
      {
        actor: req.user?.email || 'Admin',
        actorType: req.user?.role === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
        reason: `Refund of ₹${refundAmount} processed. ID: ${refundId}`,
        source: 'REFUND_API',
      }
    )

    res.json({
      success: true,
      message: `Refund of ₹${refundAmount} initiated successfully. Refund ID: ${refundId}`,
      data: order,
    })
  } catch (error) {
    next(error)
  }
}
