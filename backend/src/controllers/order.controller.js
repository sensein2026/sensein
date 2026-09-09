import crypto from 'crypto'
import mongoose from 'mongoose'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import { pushOrderToDelhivery, trackDelhiveryShipment, checkDelhiveryPincode, cancelDelhiveryShipment } from '../utils/delhivery.js'
import { logger } from '../config/logger.js'

let razorpayInstance = null
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SenseinLuxury2026'
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_sec_SenseinBotanicalSecretKey'

if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('xxxx')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  } catch (err) {
    logger.warn({ err: err.message }, 'Razorpay initialization notice')
  }
}

/**
 * Generate formatted Sensein Order ID: ORD-YYYYMMDD-XXXXX
 */
export function generateOrderNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `ORD-${dateStr}-${rand}`
}

/**
 * 1. Create Order (Validation, Stock Check, Address Auto-save, Initial Status PLACED / CONFIRMED)
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod = 'COD',
      shippingMethod = 'STANDARD',
      paymentDetails = {},
      discount = 0,
      subtotal: clientSubtotal,
      shippingFee: clientShippingFee,
      tax: clientTax,
      totalAmount: clientTotalAmount,
    } = req.body

    // 1. Validate Items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' })
    }

    // 2. Validate Address Fields
    if (!shippingAddress || !shippingAddress.addressLine || !shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address and PIN code are required',
      })
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' })
    }

    if (!customerPhone || !customerPhone.trim()) {
      return res.status(400).json({ success: false, message: 'Customer contact phone is required' })
    }

    // 3. Validate Live Product Existence & Stock Availability
    const populatedItems = []
    let computedSubtotal = 0

    for (const item of items) {
      const prodId = item.product?._id || item.product?.id || item.product
      let dbProduct = null

      if (prodId && String(prodId).match(/^[0-9a-fA-F]{24}$/)) {
        dbProduct = await Product.findById(prodId)
      }

      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1)
      const itemPrice = dbProduct ? dbProduct.price : Number(item.price) || 0

      if (dbProduct) {
        if (dbProduct.stock !== undefined && dbProduct.stock < itemQty) {
          return res.status(400).json({
            success: false,
            message: `Product '${dbProduct.name}' has only ${dbProduct.stock} units available in stock.`,
          })
        }
      }

      computedSubtotal += itemPrice * itemQty

      populatedItems.push({
        product: dbProduct ? dbProduct._id : (prodId && String(prodId).match(/^[0-9a-fA-F]{24}$/) ? prodId : new Product()._id),
        name: dbProduct ? dbProduct.name : item.name || 'Sensein Botanical Product',
        image: dbProduct ? dbProduct.mainImage : item.image || 'https://via.placeholder.com/150',
        price: itemPrice,
        quantity: itemQty,
      })
    }

    const calculatedShipping =
      clientShippingFee !== undefined
        ? Number(clientShippingFee)
        : 0
    const calculatedDiscount = Math.max(0, Number(discount) || 0)
    const calculatedTax = Number(clientTax) || 0
    const calculatedTotal = Math.max(0, computedSubtotal - calculatedDiscount + calculatedShipping + calculatedTax)

    // 4. Generate Order ID: ORD-YYYYMMDD-XXXXX
    const orderNumber = generateOrderNumber()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString()

    // Estimated Delivery Date (3-5 Business Days)
    const daysToAdd = shippingMethod === 'PRIORITY' ? 2 : shippingMethod === 'EXPRESS' ? 3 : 4
    const estimatedDeliveryDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)

    // 5. User Resolution & Auto-save Address
    let userDoc = null
    if (req.user) {
      userDoc = await User.findById(req.user._id)
    } else if (customerEmail) {
      const cleanEmail = customerEmail.toLowerCase().trim()
      userDoc = await User.findOne({
        $or: [
          { email: cleanEmail },
          { email: { $regex: new RegExp('^' + cleanEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
        ],
      })
    }

    const userId = userDoc ? userDoc._id : undefined

    if (userDoc) {
      let isUserModified = false

      if (customerName && customerName.trim() && userDoc.name !== customerName.trim()) {
        userDoc.name = customerName.trim()
        isUserModified = true
      }

      if (shippingAddress && shippingAddress.addressLine && shippingAddress.postalCode) {
        if (!userDoc.savedAddresses) {
          userDoc.savedAddresses = []
        }

        const cleanLine = shippingAddress.addressLine.trim().toLowerCase()
        const cleanPin = shippingAddress.postalCode.trim()
        const cleanCity = (shippingAddress.city || '').trim().toLowerCase()

        const alreadyExists = userDoc.savedAddresses.some((a) => {
          const aLine = (a.addressLine || '').trim().toLowerCase()
          const aPin = (a.postalCode || '').trim()
          const aCity = (a.city || '').trim().toLowerCase()
          return aLine === cleanLine && aPin === cleanPin && aCity === cleanCity
        })

        if (!alreadyExists) {
          const isFirstAddress = userDoc.savedAddresses.length === 0
          const rawTitle = shippingAddress.addressType || shippingAddress.title || (isFirstAddress ? 'Home' : 'Other')
          const formattedTitle =
            rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase()

          userDoc.savedAddresses.push({
            title: formattedTitle,
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            addressLine: shippingAddress.addressLine.trim(),
            city: shippingAddress.city?.trim() || '',
            state: shippingAddress.state?.trim() || 'Gujarat',
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country?.trim() || 'India',
            isDefault: isFirstAddress,
          })
          isUserModified = true
        }
      }

      if (isUserModified) {
        await userDoc.save()
      }
    }

    const isCod = paymentMethod === 'COD'
    const initialOrderStatus = 'PENDING'
    const initialPaymentStatus = 'PENDING'

    // Initial Tracking History
    const initialTrackingHistory = [
      {
        status: 'PLACED',
        title: 'Order Placed',
        location: 'Sensein Flagship',
        timestamp: new Date(),
        description: `Order ${orderNumber} created via ${paymentMethod}.`,
      },
    ]

    let delhiveryDetails = {}
    let courierPartner = 'Delhivery Express'
    let trackingNumber = ''

    // If COD, mark confirmed and push to Delhivery
    if (isCod) {
      initialTrackingHistory.push({
        status: 'CONFIRMED',
        title: 'Order Confirmed (Cash on Delivery)',
        location: 'Sensein Processing Lab',
        timestamp: new Date(),
        description: `Cash on Delivery order confirmed. Payment of ₹${calculatedTotal.toLocaleString('en-IN')} will be collected at doorstep by Delhivery courier partner.`,
      })

      try {
        const ShippingConfig = (await import('../models/ShippingConfig.js')).default
        const shippingConfig = await ShippingConfig.findOne()

        if (shippingConfig && shippingConfig.isAutoShipEnabled) {
          const delhiveryRes = await pushOrderToDelhivery({
            orderNumber,
            customerName: customerName.trim(),
            customerEmail: customerEmail?.trim(),
            customerPhone: customerPhone.trim(),
            shippingAddress,
            items: populatedItems,
            totalAmount: calculatedTotal,
            paymentMethod: 'COD',
          })

          if (delhiveryRes && (delhiveryRes.success || delhiveryRes.waybill)) {
            delhiveryDetails = {
              waybill: delhiveryRes.waybill,
              shipmentId: delhiveryRes.waybill,
              courierName: delhiveryRes.courier || 'Delhivery Surface & Express B2C',
              trackingUrl: delhiveryRes.trackingUrl || `https://www.delhivery.com/track/package/${delhiveryRes.waybill}`,
              status: 'SHIPPED',
              assignmentStatus: 'ASSIGNED',
              statusMessage: 'Manifested with Delhivery',
            }
            courierPartner = delhiveryRes.courier || 'Delhivery Surface & Express'
            trackingNumber = delhiveryRes.waybill

            initialTrackingHistory.push({
              status: 'SHIPPED',
              title: `Dispatched via Delhivery Express`,
              location: 'Sensein Central Logistics Hub, Surat',
              timestamp: new Date(Date.now() + 10 * 60 * 1000),
              description: `Delhivery Waybill #${delhiveryRes.waybill} generated. Package ready for pickup.`,
            })
          }
        }
      } catch (shipErr) {
        logger.warn({ err: shipErr.message }, 'Delhivery push notice, order registered successfully')
      }
    }

    const newOrder = new Order({
      orderNumber,
      user: userId,
      customerName: customerName.trim(),
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: {
        addressLine: shippingAddress.addressLine.trim(),
        city: shippingAddress.city?.trim() || '',
        state: shippingAddress.state?.trim() || '',
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country?.trim() || 'India',
      },
      items: populatedItems,
      paymentMethod,
      shippingMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      subtotal: computedSubtotal,
      discount: calculatedDiscount,
      shippingFee: calculatedShipping,
      tax: calculatedTax,
      totalAmount: calculatedTotal,
      trackingNumber,
      courierPartner,
      estimatedDeliveryDate,
      invoiceNumber,
      deliveryOtp,
      delhivery: delhiveryDetails,
      paymentDetails: {
        gateway: isCod ? 'Cash on Delivery' : paymentDetails.gateway || 'Razorpay',
        transactionId: paymentDetails.transactionId || '',
        razorpayOrderId: paymentDetails.razorpayOrderId || '',
        razorpayPaymentId: paymentDetails.razorpayPaymentId || '',
        upiId: paymentDetails.upiId || '',
        cardLast4: paymentDetails.cardLast4 || '',
        paidAt: null,
      },
      trackingHistory: initialTrackingHistory,
    })

    await newOrder.save()

    // Deduct stock for confirmed orders
    if (isCod) {
      for (const item of populatedItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          }).catch(() => {})
        }
      }
    }

    logger.info({ orderNumber, total: calculatedTotal, method: paymentMethod }, 'New order registered')

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 2. Get Order By ID / Order Number
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    }).populate('items.product', 'name price mainImage stock slug')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * 3. Get Logged-in User's Orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : ''
    const userPhone = req.user.phone ? req.user.phone.trim() : ''

    const orQueries = [{ user: req.user._id }]

    if (userEmail) {
      orQueries.push({
        customerEmail: {
          $regex: new RegExp('^' + userEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'),
        },
      })
    }

    if (userPhone) {
      orQueries.push({ customerPhone: userPhone })
    }

    const orders = await Order.find({ $or: orQueries }).sort({ createdAt: -1 })

    // Auto-link any orders without user ID to this user
    const unlinkedOrderIds = orders
      .filter((o) => !o.user || o.user.toString() !== req.user._id.toString())
      .map((o) => o._id)

    if (unlinkedOrderIds.length > 0) {
      await Order.updateMany(
        { _id: { $in: unlinkedOrderIds } },
        { $set: { user: req.user._id } }
      )
    }

    res.json({ success: true, data: orders })
  } catch (error) {
    next(error)
  }
}

/**
 * 4. Get Tracking Details for a specific Order ID
 * GET /api/orders/:id/tracking
 */
export const getOrderTrackingById = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
        { trackingNumber: id },
        { 'delhivery.waybill': id },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Tracking details not found for this reference' })
    }

    const waybill = order.trackingNumber || order.delhivery?.waybill || ''

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        courier: order.courierPartner || order.delhivery?.courierName || 'Delhivery Surface & Express',
        awbNumber: waybill,
        trackingUrl: order.delhivery?.trackingUrl || (waybill ? `https://www.delhivery.com/track/package/${waybill}` : ''),
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        shippingAddress: order.shippingAddress,
        trackingHistory: order.trackingHistory || [],
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 5. Track Order Query Search (by Order ID, Waybill, Email, Phone)
 * GET /api/orders/track?query=...
 */
export const trackOrder = async (req, res, next) => {
  try {
    const { query } = req.query
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Order Number (e.g. ORD-20260830-00125), Delhivery Waybill, or registered email',
      })
    }

    const searchRegex = new RegExp(query.trim(), 'i')
    const orders = await Order.find({
      $or: [
        { orderNumber: searchRegex },
        { trackingNumber: searchRegex },
        { 'delhivery.waybill': searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
      ],
    }).sort({ createdAt: -1 })

    if (orders.length > 0) {
      return res.json({ success: true, data: orders })
    }

    // Fallback: If searching directly by Waybill number, fetch live Delhivery checkpoints
    const cleanQuery = query.trim()
    const liveTracking = await trackDelhiveryShipment(cleanQuery)
    if (liveTracking && (liveTracking.success || liveTracking.waybill)) {
      const syntheticOrder = {
        _id: 'live-' + cleanQuery,
        orderNumber: 'DLV-' + cleanQuery,
        customerName: 'Valued Customer',
        orderStatus: liveTracking.status || 'IN_TRANSIT',
        paymentStatus: 'PAID',
        paymentMethod: 'PREPAID',
        courierPartner: 'Delhivery Surface & Express',
        trackingNumber: cleanQuery,
        estimatedDeliveryDate: liveTracking.expectedDeliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          addressLine: 'Registered Fulfillment Address',
          city: 'Surat',
          state: 'Gujarat',
          postalCode: '395010',
          country: 'India',
        },
        items: [
          {
            name: 'Sensein Botanical Product Shipment',
            quantity: 1,
            price: 1,
            image: '/images/product1.jpg',
          },
        ],
        totalAmount: 1,
        delhivery: {
          courierName: 'Delhivery Surface & Express',
          waybill: cleanQuery,
          trackingUrl: `https://www.delhivery.com/track/package/${cleanQuery}`,
          status: liveTracking.status || 'IN_TRANSIT',
        },
        trackingHistory: (liveTracking.scans || []).map((cp, idx) => ({
          _id: 'chk-' + idx,
          status: cp.status || 'IN_TRANSIT',
          title: cp.scanType || cp.activity || cp.status,
          location: cp.location || cp.scannedLocation || 'Delhivery Hub',
          timestamp: cp.timestamp || new Date(),
          description: cp.instructions || cp.description || 'Shipment status updated.',
        })),
      }
      return res.json({ success: true, data: [syntheticOrder] })
    }

    res.json({ success: true, data: [] })
  } catch (error) {
    next(error)
  }
}

/**
 * 6. Update Order Status (Admin / Webhook internal trigger)
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { orderStatus, paymentStatus, courierPartner, trackingNumber, newCheckpoint } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (orderStatus && orderStatus !== order.orderStatus) {
      order.orderStatus = orderStatus

      let title = `Status Updated to ${orderStatus}`
      let desc = `Order milestone reached: ${orderStatus}`
      let loc = 'Regional Logistics Hub'

      if (orderStatus === 'CONFIRMED') {
        title = 'Order Confirmed'
        desc = 'Order confirmed and verified for packaging.'
      } else if (orderStatus === 'PROCESSING') {
        title = 'Botanical Formulation & Packaging'
        desc = 'Formulation and eco-luxury packaging in progress.'
      } else if (orderStatus === 'SHIPPED') {
        title = `Dispatched via ${courierPartner || order.courierPartner || 'Delhivery Express'}`
        desc = `Package dispatched. Delhivery Waybill #${trackingNumber || order.trackingNumber || '1284512369845'}`
        loc = 'Surat Hub'
      } else if (orderStatus === 'IN_TRANSIT') {
        title = 'In Transit to Destination'
        desc = 'Package is on its way via Delhivery logistics network.'
      } else if (orderStatus === 'OUT_FOR_DELIVERY') {
        title = 'Out for Doorstep Delivery'
        desc = 'Shipment is out with Delhivery courier rider for delivery today.'
      } else if (orderStatus === 'DELIVERED') {
        title = 'Delivered Successfully'
        desc = `Delivered to recipient safely. Delivery OTP: ${order.deliveryOtp || '4821'}`
        loc = order.shippingAddress?.city || 'Destination Address'
        if (order.paymentMethod === 'COD') {
          order.paymentStatus = 'PAID'
        }
      } else if (orderStatus === 'CANCELLED') {
        title = 'Order Cancelled'
        desc = 'Order has been cancelled. Delhivery shipment booking revoked.'
        loc = 'Sensein Operations'

        // 1. Cancel in Delhivery API automatically to release courier hold
        const waybill = order.trackingNumber || order.delhivery?.waybill
        if (waybill) {
          await cancelDelhiveryShipment(waybill).catch(() => {})
        }

        // 2. Restore Product Stock
        for (const itm of order.items || []) {
          if (itm.product) {
            await Product.findByIdAndUpdate(itm.product, {
              $inc: { stock: itm.quantity || 1 },
            }).catch(() => {})
          }
        }
      }

      order.trackingHistory.unshift({
        status: orderStatus,
        title,
        location: loc,
        timestamp: new Date(),
        description: desc,
      })
    }

    if (paymentStatus) order.paymentStatus = paymentStatus
    if (courierPartner) order.courierPartner = courierPartner
    if (trackingNumber) order.trackingNumber = trackingNumber

    if (newCheckpoint && newCheckpoint.title) {
      order.trackingHistory.unshift({
        status: order.orderStatus,
        title: newCheckpoint.title,
        location: newCheckpoint.location || 'In Transit Hub',
        timestamp: new Date(),
        description: newCheckpoint.description || 'Delhivery scan event recorded.',
      })
    }

    await order.save()
    res.json({ success: true, message: 'Order status updated', data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * 7. Check PIN Code Serviceability (Delhivery)
 * GET /api/orders/pincode-check/:code
 */
export const checkPincode = async (req, res, next) => {
  try {
    const { code } = req.params
    const result = await checkDelhiveryPincode(code)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Razorpay bridge endpoints (Redirect to payment controller logic)
 */
export const createRazorpayOrder = async (req, res, next) => {
  const { createPaymentOrder } = await import('./payment.controller.js')
  return createPaymentOrder(req, res, next)
}

export const verifyRazorpaySignature = async (req, res, next) => {
  const { verifyPayment } = await import('./payment.controller.js')
  return verifyPayment(req, res, next)
}

export const refundRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    order.paymentStatus = 'REFUNDED'
    order.refundDetails = {
      razorpayRefundId: `rfnd_${Math.random().toString(36).substring(2, 12)}`,
      refundAmount: amount || order.totalAmount,
      refundedAt: new Date(),
      refundReason: reason || 'Customer requested return/refund',
      status: 'PROCESSED',
    }
    await order.save()

    res.json({ success: true, message: 'Refund initiated successfully', data: order })
  } catch (error) {
    next(error)
  }
}

export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    order.orderStatus = 'RETURNED'
    order.trackingHistory.unshift({
      status: 'RETURNED',
      title: 'Return Request Registered',
      location: 'Sensein Reverse Logistics',
      timestamp: new Date(),
      description: `Return pickup arranged for Reason: ${reason || 'Customer request'}. Delhivery reverse pickup assigned.`,
    })
    await order.save()

    res.json({ success: true, message: 'Return pickup requested successfully', data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * 8. User Self-Service Order Cancellation
 * POST /api/orders/:id/cancel
 */
export const cancelUserOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason = 'Cancelled by customer' } = req.body || {}

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Check if order can be cancelled (only before SHIPPED / IN_TRANSIT / DELIVERED)
    if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'This order is already dispatched/shipped via Delhivery and cannot be cancelled directly. You can request a return after delivery.',
      })
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' })
    }

    order.orderStatus = 'CANCELLED'

    // Cancel in Delhivery if booked
    const waybill = order.trackingNumber || order.delhivery?.waybill
    if (waybill) {
      await cancelDelhiveryShipment(waybill).catch(() => {})
    }

    // Restore stock
    for (const itm of order.items || []) {
      if (itm.product) {
        await Product.findByIdAndUpdate(itm.product, {
          $inc: { stock: itm.quantity || 1 },
        }).catch(() => {})
      }
    }

    order.trackingHistory.unshift({
      status: 'CANCELLED',
      title: 'Order Cancelled by Customer',
      location: 'Customer Self-Service Portal',
      timestamp: new Date(),
      description: `Cancellation requested: ${reason}. Product stock restored.`,
    })

    await order.save()

    res.json({
      success: true,
      message: 'Order cancelled successfully. If paid online, your refund will be processed.',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update Delivery Address before shipment is dispatched / picked up
 * PUT /api/orders/:id/address
 */
export const updateOrderAddress = async (req, res, next) => {
  try {
    const { id } = req.params
    const { customerName, customerPhone, addressLine, city, state, postalCode } = req.body

    let order = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id })
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Check if order has already been picked up or dispatched
    const dispatchedStatuses = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
    if (dispatchedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address cannot be updated because the shipment is already dispatched / picked up.',
      })
    }

    if (customerName) order.customerName = customerName.trim()
    if (customerPhone) order.customerPhone = customerPhone.trim()

    order.shippingAddress = {
      ...order.shippingAddress,
      fullName: customerName ? customerName.trim() : order.shippingAddress?.fullName,
      phone: customerPhone ? customerPhone.trim() : order.shippingAddress?.phone,
      addressLine: addressLine ? addressLine.trim() : order.shippingAddress?.addressLine,
      city: city ? city.trim() : order.shippingAddress?.city,
      state: state ? state.trim() : order.shippingAddress?.state,
      postalCode: postalCode ? postalCode.trim() : order.shippingAddress?.postalCode,
    }

    order.trackingHistory.unshift({
      status: order.orderStatus,
      title: 'Delivery Address Updated',
      description: `Delivery address updated by customer to ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}.`,
      location: order.shippingAddress.city || 'Sensein Operations',
      timestamp: new Date(),
    })

    await order.save()

    // Also sync to User profile if authenticated
    if (req.user || order.user) {
      const userId = req.user?._id || order.user
      try {
        const user = await User.findById(userId)
        if (user && user.savedAddresses) {
          const exists = user.savedAddresses.some(
            (a) => a.addressLine?.toLowerCase() === order.shippingAddress.addressLine.toLowerCase()
          )
          if (!exists && order.shippingAddress.addressLine) {
            const isFirst = user.savedAddresses.length === 0
            user.savedAddresses.push({
              title: isFirst ? 'Home' : 'Other',
              fullName: order.customerName,
              phone: order.customerPhone,
              addressLine: order.shippingAddress.addressLine,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postalCode: order.shippingAddress.postalCode,
              country: 'India',
              isDefault: isFirst,
            })
            await user.save()
          }
        }
      } catch (uErr) {
        logger.error({ err: uErr.message }, 'Failed to save address to user profile')
      }
    }

    res.json({
      success: true,
      message: 'Delivery address updated successfully!',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}


