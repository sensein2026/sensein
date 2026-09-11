import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import Refund from '../models/Refund.js'
import ProcessedWebhookEvent from '../models/ProcessedWebhookEvent.js'
import StockReservation from '../models/StockReservation.js'
import AuditLog from '../models/AuditLog.js'
import { convertReservation } from './stockService.js'
import { logger } from '../config/logger.js'
import { withTransactionRunner } from '../utils/transactionRunner.js'
import { sendNotification } from './notificationService.js'

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
 * Amount in paise strictly calculated server-side
 */
export async function createRazorpayOrder({ order, currency = 'INR', receipt = null, notes = {} }) {
  const amountInPaise = Math.round(Number(order.amountBreakdown?.totalAmount || order.totalAmount) * 100)

  if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
    throw new Error('Invalid order amount. Minimum is ₹1.00 (100 paise).')
  }

  const orderReceipt = receipt || String(order.orderNumber)
  const razorpayInstance = getRazorpayInstance()
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'

  if (!razorpayInstance) {
    // Generate test-mode simulated Razorpay order if live keys not configured
    const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    order.paymentDetails.razorpayOrderId = simulatedOrderId
    await order.save()

    return {
      id: simulatedOrderId,
      order_id: simulatedOrderId,
      amount: amountInPaise,
      currency,
      key: razorpayKeyId,
      key_id: razorpayKeyId,
      simulated: true,
    }
  }

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: amountInPaise,
    currency,
    receipt: orderReceipt,
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      ...notes,
    },
  })

  order.paymentDetails.razorpayOrderId = razorpayOrder.id
  await order.save()

  return {
    id: razorpayOrder.id,
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: razorpayKeyId,
    key_id: razorpayKeyId,
    data: razorpayOrder,
  }
}

/**
 * 2. Verify Razorpay Payment Signature
 * Computes HMAC-SHA256 over `order_id|payment_id`
 */
export function verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    // In local development without key secret, check for test signatures
    if (process.env.NODE_ENV !== 'production' && razorpaySignature?.startsWith('sim_')) {
      return true
    }
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  return expectedSignature === razorpaySignature
}

/**
 * 3. Finalize Order on Payment Success (Shared logic used by verify and webhook)
 */
export async function finalizeOrderPayment({ order, paymentId, signature = '', source = 'RAZORPAY_VERIFY' }) {
  // Idempotency: if already PAID with same paymentId, return early
  if (order.paymentStatus === 'PAID' && order.paymentDetails?.razorpayPaymentId === paymentId) {
    return { success: true, order, alreadyFinalized: true }
  }

  await withTransactionRunner(async (session) => {
    // 1. Convert StockReservation to real stock decrement
    await convertReservation(order._id, session)

    // 2. Update Order fields
    order.paymentStatus = 'PAID'
    order.orderStatus = 'CONFIRMED'
    order.fulfillmentStatus = 'CONFIRMED'
    order.amountBreakdown.paidAmount = order.amountBreakdown.totalAmount
    order.amountBreakdown.refundableAmount = order.amountBreakdown.totalAmount
    order.paymentDetails.razorpayPaymentId = paymentId
    if (signature) order.paymentDetails.razorpaySignature = signature
    order.paymentDetails.paidAt = new Date()

    order.timeline.push({
      status: 'CONFIRMED',
      note: `Online payment of ₹${order.amountBreakdown.totalAmount} verified successfully. Payment ID: ${paymentId}`,
      source: 'SYSTEM',
      actor: 'Razorpay Payment Gateway',
      actorType: 'WEBHOOK',
      at: new Date(),
    })

    await order.save({ session })
  })

  // 3. Write Audit Log
  await AuditLog.create({
    action: 'PAYMENT_CAPTURED',
    actor: 'system',
    targetType: 'Order',
    targetId: order.orderNumber,
    reason: `Payment captured via Razorpay. Payment ID: ${paymentId}`,
    metadata: { paymentId, amount: order.amountBreakdown.totalAmount },
  }).catch(() => {})

  // 4. Send Confirmation Notification (async)
  sendNotification({
    userId: order.user,
    orderId: order._id,
    type: 'ORDER_CONFIRMED',
    data: { orderNumber: order.orderNumber, totalAmount: order.amountBreakdown.totalAmount },
  }).catch(() => {})

  return { success: true, order }
}

/**
 * 4. Process Razorpay Webhook Event with Two-Layer Idempotency
 */
export async function processRazorpayWebhook({ rawBody, signatureHeader, eventPayload }) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET

  // Verify Webhook Signature if secret exists
  if (webhookSecret && signatureHeader) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signatureHeader) {
      throw new Error('Invalid Razorpay Webhook signature')
    }
  }

  const eventId = eventPayload.event_id || eventPayload.id || `rzp_${eventPayload.event}_${Date.now()}`
  const eventType = eventPayload.event

  // Database-Level Idempotency Guarantee: unique compound index on (provider, eventId)
  try {
    await ProcessedWebhookEvent.create({
      provider: 'razorpay',
      eventId,
      payloadSummary: { event: eventType, entityId: eventPayload.payload?.payment?.entity?.id },
    })
  } catch (err) {
    if (err.code === 11000) {
      logger.info({ eventId, eventType }, 'Duplicate Razorpay webhook received; safely ignoring.')
      return { success: true, duplicate: true, message: 'Event already processed' }
    }
    throw err
  }

  // Handle Event Types
  const paymentEntity = eventPayload.payload?.payment?.entity
  const refundEntity = eventPayload.payload?.refund?.entity
  const orderEntity = eventPayload.payload?.order?.entity

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id
    const paymentId = paymentEntity?.id

    if (rzpOrderId) {
      const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': rzpOrderId })
      if (order && order.paymentStatus !== 'PAID') {
        await finalizeOrderPayment({
          order,
          paymentId: paymentId || order.paymentDetails?.razorpayPaymentId || `pay_${Date.now()}`,
          source: 'RAZORPAY_WEBHOOK',
        })
      }
    }
  } else if (eventType === 'payment.failed') {
    const rzpOrderId = paymentEntity?.order_id
    if (rzpOrderId) {
      const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': rzpOrderId })
      if (order && order.paymentStatus === 'PENDING') {
        order.paymentStatus = 'FAILED'
        order.timeline.push({
          status: 'PAYMENT_FAILED',
          note: `Payment failed: ${paymentEntity?.error_description || 'Transaction declined'}`,
          source: 'SYSTEM',
          actor: 'Razorpay Gateway',
          actorType: 'WEBHOOK',
        })
        await order.save()
      }
    }
  } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
    const refundId = refundEntity?.id
    const paymentId = refundEntity?.payment_id

    if (refundId && paymentId) {
      const refundDoc = await Refund.findOne({
        $or: [{ razorpayRefundId: refundId }, { razorpayPaymentId: paymentId }],
      })
      if (refundDoc) {
        refundDoc.status = eventType === 'refund.processed' ? 'PROCESSED' : 'INITIATED'
        refundDoc.processedAt = new Date()
        await refundDoc.save()
      }

      const order = await Order.findOne({ 'paymentDetails.razorpayPaymentId': paymentId })
      if (order) {
        if (eventType === 'refund.processed') {
          order.paymentStatus = 'REFUNDED'
          order.refundStatus = 'COMPLETED'
          order.refundCompletedAt = new Date()
        } else {
          order.paymentStatus = 'REFUND_INITIATED'
          order.refundStatus = 'PROCESSING'
          order.refundInitiatedAt = new Date()
        }
        await order.save()
      }
    }
  }

  return { success: true, event: eventType }
}

/**
 * 5. Initiate Razorpay Refund with Partial Refund Support
 */
export async function initiateRefund({ order, amount = null, reason = 'Customer Cancellation', initiatedBy = 'system' }) {
  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUND_INITIATED') {
    throw new Error('Refunds can only be initiated on orders with paymentStatus: PAID')
  }

  const refundAmount = amount ? Number(amount) : Number(order.amountBreakdown?.refundableAmount || order.amountBreakdown?.totalAmount || order.totalAmount)
  const maxRefundable = Number(order.amountBreakdown?.refundableAmount || order.amountBreakdown?.totalAmount)

  if (refundAmount <= 0 || refundAmount > maxRefundable) {
    throw new Error(`Invalid refund amount. Maximum refundable amount is ₹${maxRefundable}.`)
  }

  const paymentId = order.paymentDetails?.razorpayPaymentId
  if (!paymentId) {
    throw new Error('No Razorpay payment ID found on order to refund.')
  }

  const razorpayInstance = getRazorpayInstance()
  let razorpayRefundId = `rfnd_sim_${Date.now()}`

  if (razorpayInstance && !paymentId.startsWith('pay_sim_')) {
    try {
      const refundRes = await razorpayInstance.payments.refund(paymentId, {
        amount: Math.round(refundAmount * 100), // in paise
        notes: {
          orderNumber: order.orderNumber,
          reason,
          initiatedBy,
        },
      })
      razorpayRefundId = refundRes.id
    } catch (err) {
      logger.error({ err: err.message, paymentId }, 'Razorpay refund API call failed')
      throw new Error(`Razorpay refund failed: ${err?.error?.description || err.message}`)
    }
  }

  // Create Refund ledger record
  const refundRecord = await Refund.create({
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId: order.user,
    razorpayPaymentId: paymentId,
    razorpayRefundId,
    amount: refundAmount,
    currency: 'INR',
    reason,
    status: 'INITIATED',
    initiatedBy,
    processedAt: new Date(),
  })

  // Update order financial accounting
  order.amountBreakdown.refundedAmount = (order.amountBreakdown.refundedAmount || 0) + refundAmount
  order.amountBreakdown.refundableAmount = Math.max(0, maxRefundable - refundAmount)
  order.paymentStatus = order.amountBreakdown.refundableAmount === 0 ? 'REFUNDED' : 'REFUND_INITIATED'
  order.refundStatus = 'INITIATED'
  order.refundInitiatedAt = new Date()
  order.refundDetails = {
    razorpayRefundId,
    refundAmount,
    refundedAt: new Date(),
    refundReason: reason,
    status: 'INITIATED',
  }

  order.timeline.push({
    status: 'REFUND_INITIATED',
    note: `Refund of ₹${refundAmount} initiated via Razorpay (${reason}). Refund ID: ${razorpayRefundId}`,
    source: 'ADMIN',
    actor: initiatedBy,
    actorType: 'ADMIN',
    at: new Date(),
  })

  await order.save()

  // Audit log
  await AuditLog.create({
    action: 'REFUND_INITIATED',
    actor: initiatedBy,
    targetType: 'Order',
    targetId: order.orderNumber,
    reason: `Refund initiated for ₹${refundAmount}: ${reason}`,
    metadata: { refundId: razorpayRefundId, amount: refundAmount, orderId: order._id },
  }).catch(() => {})

  return {
    success: true,
    refund: refundRecord,
    order,
    message: `Refund of ₹${refundAmount} initiated successfully.`,
  }
}
