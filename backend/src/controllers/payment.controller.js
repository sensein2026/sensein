import Order from '../models/Order.js'
import Product from '../models/Product.js'
import {
  createRazorpayOrder,
  verifySignature,
  finalizeOrderPayment,
  processRazorpayWebhook,
  initiateRefund,
} from '../services/razorpayService.js'
import { reserveStock } from '../services/stockService.js'
import { sendSuccess, sendError } from '../utils/responseEnvelope.js'
import { logger } from '../config/logger.js'

/**
 * 1. Create Razorpay Payment Order
 * POST /api/payment/create-order or POST /api/payment/create
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, items, shippingAddress, currency = 'INR', receipt, notes } = req.body

    let order = null
    if (orderId) {
      order = await Order.findOne({
        $or: [
          { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
        ],
      })
    }

    // If order already exists
    if (order) {
      if (order.paymentStatus === 'PAID') {
        return sendError(res, 'This order has already been paid for.', 400, 'ORDER_ALREADY_PAID')
      }

      // Re-reserve stock if not already active
      await reserveStock({
        orderId: order._id,
        userId: req.user?._id || order.user,
        items: order.items,
        purpose: 'ORDER_CHECKOUT',
      })

      const razorpayOrder = await createRazorpayOrder({ order, currency, receipt, notes })
      return sendSuccess(res, 'Payment order created successfully', {
        ...razorpayOrder,
        orderId: order._id,
        orderNumber: order.orderNumber,
      })
    }

    // If order items sent directly from cart
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Order items or orderId are required.', 400, 'INVALID_ITEMS')
    }

    // Server-side price recomputation from Database (Never trust client sent prices)
    let calculatedSubtotal = 0
    const snapshotItems = []

    for (const item of items) {
      const prodId = item.productId || item.product || item._id
      const prod = await Product.findById(prodId)
      if (!prod || !prod.isActive) {
        return sendError(res, `Product "${item.name || prodId}" is unavailable.`, 400, 'PRODUCT_UNAVAILABLE')
      }

      const qty = Number(item.quantity || item.qty || 1)
      const unitPrice = Number(prod.price)
      const lineTotal = unitPrice * qty
      calculatedSubtotal += lineTotal

      snapshotItems.push({
        product: prod._id,
        productId: prod._id,
        productName: prod.name,
        name: prod.name,
        variantId: item.variantId || null,
        variantName: item.variantName || '',
        sku: prod.sku || '',
        image: prod.mainImage || '',
        qty,
        quantity: qty,
        unitPrice,
        price: unitPrice,
        discount: 0,
        tax: 0,
        finalPrice: lineTotal,
        weight: prod.weight || 250,
        length: prod.dimensions?.length || 15,
        breadth: prod.dimensions?.breadth || 10,
        height: prod.dimensions?.height || 8,
      })
    }

    const shippingCharge = calculatedSubtotal >= 999 ? 0 : 99
    const totalAmount = calculatedSubtotal + shippingCharge

    // Generate unique orderNumber
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(100000 + Math.random() * 900000)
    const orderNumber = `SENSEIN-${dateStr}-${randSuffix}`

    // Create Draft Order
    const newOrder = await Order.create({
      orderNumber,
      user: req.user?._id || null,
      customerName: shippingAddress?.fullName || req.user?.name || 'Customer',
      customerEmail: req.user?.email || shippingAddress?.email || 'customer@sensein.com',
      customerPhone: shippingAddress?.phone || req.user?.phone || '9265259954',
      shippingAddress: {
        fullName: shippingAddress?.fullName || 'Customer',
        phone: shippingAddress?.phone || '9265259954',
        addressLine1: shippingAddress?.addressLine1 || shippingAddress?.addressLine || '',
        addressLine2: shippingAddress?.addressLine2 || '',
        city: shippingAddress?.city || 'Surat',
        state: shippingAddress?.state || 'Gujarat',
        pincode: shippingAddress?.pincode || shippingAddress?.postalCode || '395010',
        country: shippingAddress?.country || 'India',
      },
      items: snapshotItems,
      amountBreakdown: {
        subtotal: calculatedSubtotal,
        discount: 0,
        shippingCharge,
        tax: 0,
        totalAmount,
        paidAmount: 0,
        refundableAmount: 0,
        refundedAmount: 0,
        currency,
      },
      subtotal: calculatedSubtotal,
      totalAmount,
      shippingFee: shippingCharge,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      timeline: [
        {
          status: 'PLACED',
          note: 'Order created, awaiting online payment confirmation.',
          source: 'SYSTEM',
          actor: 'Checkout Engine',
          actorType: 'SYSTEM',
        },
      ],
    })

    // Reserve Stock
    const resResult = await reserveStock({
      orderId: newOrder._id,
      userId: req.user?._id,
      items: snapshotItems,
      purpose: 'ORDER_CHECKOUT',
    })

    if (!resResult.success) {
      await Order.findByIdAndDelete(newOrder._id)
      return sendError(res, resResult.message || 'Items out of stock', 400, 'OUT_OF_STOCK')
    }

    const razorpayOrder = await createRazorpayOrder({ order: newOrder, currency, receipt, notes })

    return sendSuccess(res, 'Payment order created successfully', {
      ...razorpayOrder,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'createPaymentOrder error')
    return sendError(res, error.message || 'Failed to initialize payment', 500, 'PAYMENT_INIT_FAILED', error)
  }
}

/**
 * 2. Verify Payment (UX fast-path)
 * POST /api/payment/verify or POST /api/verify-payment
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
    } = req.body

    const activeOrderId = razorpay_order_id || order_id
    const activePaymentId = razorpay_payment_id || payment_id
    const activeSignature = razorpay_signature || signature

    if (!activeOrderId || !activePaymentId) {
      return sendError(res, 'Missing required fields: order_id and payment_id are required.', 400, 'INVALID_PARAMS')
    }

    const isValid = verifySignature({
      razorpayOrderId: activeOrderId,
      razorpayPaymentId: activePaymentId,
      razorpaySignature: activeSignature,
    })

    if (!isValid) {
      return sendError(res, 'Payment verification failed: Invalid signature.', 400, 'INVALID_SIGNATURE')
    }

    // Find Order
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

    if (!order) {
      return sendError(res, 'Order not found for payment', 404, 'ORDER_NOT_FOUND')
    }

    const finalizeResult = await finalizeOrderPayment({
      order,
      paymentId: activePaymentId,
      signature: activeSignature,
      source: 'RAZORPAY_VERIFY',
    })

    return sendSuccess(res, 'Payment verified and order confirmed successfully.', {
      orderNumber: order.orderNumber,
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      data: order,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'verifyPayment error')
    return sendError(res, error.message || 'Payment verification failed', 500, 'VERIFY_FAILED', error)
  }
}

/**
 * 3. Handle Webhook (Authoritative Source of Truth)
 * POST /api/payment/webhook
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body)
    const signatureHeader = req.headers['x-razorpay-signature']
    const eventPayload = req.body

    const result = await processRazorpayWebhook({
      rawBody,
      signatureHeader,
      eventPayload,
    })

    return res.status(200).json({ success: true, message: 'Webhook processed', result })
  } catch (error) {
    logger.error({ err: error.message }, 'Razorpay webhook handler error')
    // Return 200 on validation or duplicate error so webhook provider doesn't spin retry storm
    return res.status(200).json({ success: false, message: error.message })
  }
}

/**
 * 4. Initiate Refund (Admin / Superadmin)
 * POST /api/payment/refund
 */
export const handleRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body

    if (!orderId) {
      return sendError(res, 'orderId is required for refund', 400, 'ORDER_ID_REQUIRED')
    }

    const order = await Order.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    const refundResult = await initiateRefund({
      order,
      amount,
      reason: reason || 'Admin initiated refund',
      initiatedBy: req.user?.email || 'admin',
    })

    return sendSuccess(res, refundResult.message, refundResult)
  } catch (error) {
    logger.error({ err: error.message }, 'Refund controller error')
    return sendError(res, error.message || 'Refund processing failed', 400, 'REFUND_FAILED', error)
  }
}

/**
 * 5. Mark Payment Failed
 * POST /api/payment/failed
 */
export const markPaymentFailed = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body
    if (orderId) {
      const order = await Order.findOne({
        $or: [
          { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
          { orderNumber: orderId },
        ],
      })
      if (order && order.paymentStatus === 'PENDING') {
        order.paymentStatus = 'FAILED'
        order.timeline.push({
          status: 'PAYMENT_FAILED',
          note: `Payment attempt failed: ${reason || 'Transaction abandoned or cancelled'}`,
          source: 'SYSTEM',
          actor: req.user?.email || 'Customer',
          actorType: 'CUSTOMER',
        })
        await order.save()
      }
    }
    return sendSuccess(res, 'Payment status updated to failed', {})
  } catch (error) {
    return sendError(res, error.message, 500, 'PAYMENT_FAILED_UPDATE_ERROR')
  }
}
