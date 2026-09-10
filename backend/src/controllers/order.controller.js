import crypto from 'crypto'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Shipment from '../models/Shipment.js'
import { reserveStock, releaseStock, commitStock } from '../services/stockService.js'
import {
  transitionOrderStatus,
  isAddressEditAllowed,
  isPrePickupCancellationAllowed,
} from '../services/orderStatusEngine.js'
import {
  pushOrderToDelhivery,
  trackDelhiveryShipment,
  checkDelhiveryPincode,
  cancelDelhiveryShipment,
  generateDelhiveryWaybill,
  generateSortCode,
} from '../utils/delhivery.js'
import { getRazorpayInstance, createPaymentOrder } from './payment.controller.js'
import { logger } from '../config/logger.js'

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
 * 1. Create Order (Validation, Stock Reservation, Address Auto-save, Product Snapshotting)
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      items,
      paymentMethod = 'COD',
      shippingMethod = 'STANDARD',
      paymentDetails = {},
      discount = 0,
      shippingFee: clientShippingFee,
      tax: clientTax,
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

    // 3. Validate Live Product Existence, Stock & Calculate Server-Verified Subtotal & Snapshots
    const populatedItems = []
    let computedSubtotal = 0
    let totalWeightGrams = 0

    for (const item of items) {
      const prodId = item.product?._id || item.product?.id || item.product
      let dbProduct = null

      if (prodId && String(prodId).match(/^[0-9a-fA-F]{24}$/)) {
        dbProduct = await Product.findById(prodId)
      }

      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1)
      const itemPrice = dbProduct ? dbProduct.price : Number(item.price) || 0
      const itemWeight = dbProduct?.weight || item.weight || 250
      const itemDimensions = dbProduct?.dimensions || item.dimensions || { length: 15, breadth: 10, height: 8 }

      if (dbProduct) {
        if (dbProduct.stock !== undefined && dbProduct.stock < itemQty) {
          return res.status(400).json({
            success: false,
            message: `Product '${dbProduct.name}' has only ${dbProduct.stock} units available in stock.`,
          })
        }
      }

      computedSubtotal += itemPrice * itemQty
      totalWeightGrams += itemWeight * itemQty

      populatedItems.push({
        product: dbProduct ? dbProduct._id : (prodId && String(prodId).match(/^[0-9a-fA-F]{24}$/) ? prodId : new Product()._id),
        name: dbProduct ? dbProduct.name : item.name || 'Sensein Botanical Product',
        sku: dbProduct?.sku || item.sku || '',
        image: dbProduct ? dbProduct.mainImage : item.image || '/images/product1.jpg',
        price: itemPrice,
        quantity: itemQty,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        weight: itemWeight,
        length: itemDimensions.length || 15,
        breadth: itemDimensions.breadth || 10,
        height: itemDimensions.height || 8,
      })
    }

    const calculatedShipping = clientShippingFee !== undefined ? Number(clientShippingFee) : 0
    const calculatedDiscount = Math.max(0, Number(discount) || 0)
    const calculatedTax = Number(clientTax) || 0
    const calculatedTotal = Math.max(0, computedSubtotal - calculatedDiscount + calculatedShipping + calculatedTax)

    // 4. Generate Order ID
    const orderNumber = generateOrderNumber()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString()

    const daysToAdd = shippingMethod === 'PRIORITY' ? 2 : shippingMethod === 'EXPRESS' ? 3 : 4
    const estimatedDeliveryDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)

    // 5. User Resolution & Auto-save Address
    let userDoc = null
    if (req.user) {
      userDoc = await User.findById(req.user._id)
    } else if (customerEmail) {
      const cleanEmail = customerEmail.toLowerCase().trim()
      userDoc = await User.findOne({ email: cleanEmail })
    }

    const userId = userDoc ? userDoc._id : undefined

    if (userDoc && shippingAddress) {
      if (!userDoc.savedAddresses) userDoc.savedAddresses = []
      const cleanLine = shippingAddress.addressLine.trim().toLowerCase()
      const cleanPin = shippingAddress.postalCode.trim()

      const exists = userDoc.savedAddresses.some(
        (a) => (a.addressLine || '').toLowerCase().trim() === cleanLine && (a.postalCode || '').trim() === cleanPin
      )

      if (!exists) {
        userDoc.savedAddresses.push({
          title: userDoc.savedAddresses.length === 0 ? 'Home' : 'Other',
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          addressLine: shippingAddress.addressLine.trim(),
          city: shippingAddress.city?.trim() || '',
          state: shippingAddress.state?.trim() || 'Gujarat',
          postalCode: shippingAddress.postalCode.trim(),
          country: 'India',
          isDefault: userDoc.savedAddresses.length === 0,
        })
        await userDoc.save().catch(() => {})
      }
    }

    const isCod = paymentMethod === 'COD'
    const initialOrderStatus = 'ACTIVE'
    const initialFulfillmentStatus = isCod ? 'CONFIRMED' : 'NEW'
    const initialPaymentStatus = isCod ? 'PENDING' : 'PENDING'
    const initialCodStatus = isCod ? 'PENDING' : 'NOT_APPLICABLE'

    const totalWeightKg = Math.max(0.1, totalWeightGrams / 1000)

    const newOrder = new Order({
      orderNumber,
      user: userId,
      customerName: customerName.trim(),
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: {
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        addressLine: shippingAddress.addressLine.trim(),
        city: shippingAddress.city?.trim() || '',
        state: shippingAddress.state?.trim() || '',
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country?.trim() || 'India',
      },
      billingAddress: billingAddress || shippingAddress,
      items: populatedItems,
      paymentMethod,
      shippingMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      fulfillmentStatus: initialFulfillmentStatus,
      codCollectionStatus: initialCodStatus,
      codAmount: isCod ? calculatedTotal : 0,
      subtotal: computedSubtotal,
      discount: calculatedDiscount,
      shippingFee: calculatedShipping,
      tax: calculatedTax,
      totalAmount: calculatedTotal,
      courierPartner: 'Delhivery Express',
      estimatedDeliveryDate,
      invoiceNumber,
      deliveryOtp,
      packageDetails: {
        deadWeight: totalWeightKg,
        volumetricWeight: totalWeightKg,
        chargedWeight: totalWeightKg,
        length: 15,
        breadth: 10,
        height: 8,
      },
      paymentDetails: {
        gateway: isCod ? 'Cash on Delivery' : paymentDetails.gateway || 'Razorpay',
        transactionId: paymentDetails.transactionId || '',
        razorpayOrderId: paymentDetails.razorpayOrderId || '',
        razorpayPaymentId: paymentDetails.razorpayPaymentId || '',
        upiId: paymentDetails.upiId || '',
        cardLast4: paymentDetails.cardLast4 || '',
        paidAt: null,
      },
      timeline: [
        {
          orderId: orderNumber,
          previousStatus: 'NONE',
          newStatus: isCod ? 'CONFIRMED' : 'ORDER_PLACED',
          timestamp: new Date(),
          actor: customerName.trim(),
          actorType: 'CUSTOMER',
          reason: `Order created via ${paymentMethod}.`,
          source: 'STOREFRONT_CHECKOUT',
        },
      ],
      trackingHistory: [
        {
          status: 'ORDER_PLACED',
          title: 'Order Placed',
          location: 'Sensein Flagship',
          timestamp: new Date(),
          description: `Order ${orderNumber} created via ${paymentMethod}.`,
        },
      ],
    })

    if (isCod) {
      newOrder.trackingHistory.push({
        status: 'CONFIRMED',
        title: 'Order Confirmed (Cash on Delivery)',
        location: 'Sensein Central Hub',
        timestamp: new Date(),
        description: `Cash on Delivery order confirmed. Payment of ₹${calculatedTotal.toLocaleString('en-IN')} will be collected at doorstep by Delhivery courier.`,
      })
    }

    await newOrder.save()

    // 6. Reserve Stock
    await reserveStock(populatedItems)

    // 7. Auto-create initial Shipment record
    try {
      const initialShipment = new Shipment({
        order: newOrder._id,
        orderNumber: newOrder.orderNumber,
        shipmentNumber: `SHP-${newOrder.orderNumber}-1`,
        shipmentType: 'FORWARD',
        courier: 'Delhivery Surface & Express B2C',
        status: 'SHIPMENT_CREATED',
        pickupStatus: 'PENDING',
        origin: {
          name: 'Sensein Central Logistics Hub',
          addressLine: '104, Vijaynagar 2, Yogichowk',
          city: 'Surat',
          state: 'Gujarat',
          postalCode: '395010',
          phone: '7984919956',
        },
        destination: newOrder.shippingAddress,
        packageDetails: {
          weight: totalWeightKg,
          length: 15,
          breadth: 10,
          height: 8,
          chargedWeight: totalWeightKg,
        },
        itemsSnapshot: populatedItems,
      })

      await initialShipment.save()
      newOrder.activeShipment = initialShipment._id
      newOrder.shipments = [initialShipment._id]
      await newOrder.save()
    } catch (shpErr) {
      logger.warn({ err: shpErr.message }, 'Initial shipment record notice')
    }

    logger.info({ orderNumber, total: calculatedTotal, method: paymentMethod }, 'New order registered successfully')

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
    })
      .populate('items.product', 'name price mainImage stock slug')
      .populate('activeShipment')
      .populate('shipments')
      .populate('returnRequests')

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

    const orders = await Order.find({ $or: orQueries })
      .sort({ createdAt: -1 })
      .populate('activeShipment')
      .populate('returnRequests')

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
    }).populate('activeShipment')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Tracking details not found for this reference' })
    }

    const waybill = order.trackingNumber || order.activeShipment?.waybill || order.delhivery?.waybill || ''

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentStatus: order.paymentStatus,
        codCollectionStatus: order.codCollectionStatus,
        courier: order.courierPartner || 'Delhivery Express',
        awbNumber: waybill,
        trackingUrl: waybill ? `https://www.delhivery.com/track/package/${waybill}` : '',
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        shippingAddress: order.shippingAddress,
        trackingHistory: order.trackingHistory || [],
        timeline: order.timeline || [],
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 5. Track Order Query Search
 * GET /api/orders/track?query=...
 */
export const trackOrder = async (req, res, next) => {
  try {
    const { query } = req.query
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Order Number (e.g. ORD-20260910-12345), Delhivery Waybill, or registered email',
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
    })
      .sort({ createdAt: -1 })
      .populate('activeShipment')

    res.json({ success: true, data: orders })
  } catch (error) {
    next(error)
  }
}

/**
 * 6. Update Delivery Address before physical courier pickup
 * PUT /api/orders/:id/address
 */
export const updateOrderAddress = async (req, res, next) => {
  try {
    const { id } = req.params
    const { customerName, customerPhone, addressLine, city, state, postalCode } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    }).populate('activeShipment')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // STRICT CHECK: Disallow address editing after physical pickup
    if (!isAddressEditAllowed(order)) {
      return res.status(400).json({
        success: false,
        message: 'Address editing is locked because your parcel has already been picked up.',
      })
    }

    const previousAddress = order.shippingAddress ? { ...order.shippingAddress } : null

    if (customerName) order.customerName = customerName.trim()
    if (customerPhone) order.customerPhone = customerPhone.trim()

    const newShippingAddress = {
      fullName: customerName ? customerName.trim() : order.shippingAddress?.fullName,
      phone: customerPhone ? customerPhone.trim() : order.shippingAddress?.phone,
      addressLine: addressLine ? addressLine.trim() : order.shippingAddress?.addressLine,
      city: city ? city.trim() : order.shippingAddress?.city,
      state: state ? state.trim() : order.shippingAddress?.state,
      postalCode: postalCode ? postalCode.trim() : order.shippingAddress?.postalCode,
      country: 'India',
    }

    order.shippingAddress = newShippingAddress
    order.addressUpdatedAt = new Date()

    // Record address history
    if (!Array.isArray(order.addressEditHistory)) order.addressEditHistory = []
    order.addressEditHistory.unshift({
      updatedAt: new Date(),
      updatedBy: req.user?.role === 'ADMIN' ? 'Admin' : req.user?.name || 'Customer',
      reason: 'Customer requested delivery address correction before physical courier pickup',
      previous: previousAddress,
      updated: newShippingAddress,
    })

    // If active shipment already has AWB generated before pickup, void old shipment & generate new shipment
    if (order.activeShipment && order.activeShipment.waybill) {
      try {
        await cancelDelhiveryShipment(order.activeShipment.waybill).catch(() => {})
        order.activeShipment.isActive = false
        order.activeShipment.status = 'CANCELLED'
        order.activeShipment.cancellationReason = 'Address modified by customer before pickup'
        await order.activeShipment.save()

        // Generate new active shipment
        const newWaybill = generateDelhiveryWaybill()
        const newShipment = new Shipment({
          order: order._id,
          orderNumber: order.orderNumber,
          shipmentNumber: `SHP-${order.orderNumber}-${(order.shipments?.length || 1) + 1}`,
          shipmentType: 'ADDRESS_CHANGE',
          parentShipmentId: order.activeShipment._id,
          courier: 'Delhivery Surface & Express B2C',
          waybill: newWaybill,
          status: 'READY_FOR_PICKUP',
          pickupStatus: 'SCHEDULED',
          destination: newShippingAddress,
          itemsSnapshot: order.items,
        })
        await newShipment.save()
        order.activeShipment = newShipment._id
        if (!Array.isArray(order.shipments)) order.shipments = []
        order.shipments.push(newShipment._id)
        order.trackingNumber = newWaybill
      } catch (shpErr) {
        logger.warn({ err: shpErr.message }, 'Shipment re-manifestation notice')
      }
    }

    await transitionOrderStatus(
      order,
      {},
      {
        actor: req.user?.email || 'Customer',
        actorType: req.user?.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
        reason: `Delivery address updated to ${newShippingAddress.addressLine}, ${newShippingAddress.city}, ${newShippingAddress.state} - ${newShippingAddress.postalCode}.`,
        source: 'ADDRESS_EDIT',
      }
    )

    res.json({
      success: true,
      message: 'Delivery address updated successfully!',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 7. Cancel Order (Pre-pickup cancellation vs Post-pickup RTO)
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
    }).populate('activeShipment')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (order.orderStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' })
    }

    const isPrePickup = isPrePickupCancellationAllowed(order)

    if (isPrePickup) {
      // 1. Pre-pickup cancellation
      if (order.activeShipment && order.activeShipment.waybill) {
        await cancelDelhiveryShipment(order.activeShipment.waybill).catch(() => {})
        order.activeShipment.status = 'CANCELLED'
        order.activeShipment.isActive = false
        await order.activeShipment.save()
      }

      // 2. Release reserved stock
      await releaseStock(order.items)

      // 3. Handle Prepaid Razorpay Refund if order is PAID
      let refundMessage = ''
      if (order.paymentStatus === 'PAID' && order.paymentMethod !== 'COD') {
        const paymentId = order.paymentDetails?.razorpayPaymentId
        const refundAmount = order.totalAmount || order.subtotal || 0
        const razorpayInstance = getRazorpayInstance()
        let razorpayRefund = null

        if (razorpayInstance && paymentId && !paymentId.startsWith('dummy')) {
          try {
            const refundPaise = Math.round(refundAmount * 100)
            razorpayRefund = await razorpayInstance.payments.refund(paymentId, {
              amount: refundPaise,
              notes: {
                orderNumber: order.orderNumber,
                reason: `Customer pre-pickup cancellation: ${reason}`,
              },
            })
          } catch (rzpErr) {
            logger.error({ err: rzpErr }, 'Razorpay refund error on cancellation')
            order.refundStatus = 'FAILED'
            order.refundDetails = {
              refundAmount,
              status: 'FAILED',
              failureReason: rzpErr.error?.description || rzpErr.message || 'Razorpay refund API error',
            }
          }
        }

        const refundId = razorpayRefund?.id || (paymentId ? `rfnd_sim_${Date.now()}` : null)
        if (refundId && order.refundStatus !== 'FAILED') {
          order.paymentStatus = 'REFUNDED'
          order.refundStatus = 'COMPLETED'
          order.refundDetails = {
            razorpayRefundId: refundId,
            refundAmount,
            refundedAt: new Date(),
            refundReason: `Customer pre-pickup cancellation: ${reason}`,
            status: 'COMPLETED',
          }
          refundMessage = ` Refund of ₹${refundAmount} has been initiated via Razorpay (Refund ID: ${refundId}).`
        } else if (order.refundStatus === 'FAILED') {
          refundMessage = ' Cancellation recorded, but payment refund gateway returned an error. Admin will retry refund shortly.'
        }
      }

      // 4. Mark CANCELLED
      order.orderStatus = 'CANCELLED'
      order.fulfillmentStatus = 'CANCELLED'

      await transitionOrderStatus(
        order,
        {
          orderStatus: 'CANCELLED',
          fulfillmentStatus: 'CANCELLED',
          paymentStatus: order.paymentStatus,
          refundStatus: order.refundStatus || 'NONE',
        },
        {
          actor: req.user?.email || 'Customer',
          actorType: 'CUSTOMER',
          reason: `${reason}.${refundMessage}`,
          source: 'CUSTOMER_CANCEL',
        }
      )

      return res.json({
        success: true,
        message: `Order cancelled successfully. Reserved stock has been released.${refundMessage}`,
        data: order,
      })
    } else {
      // 2. Post-pickup cancellation -> RTO flow
      order.orderStatus = 'RTO'
      order.rtoStatus = 'REQUESTED'

      await transitionOrderStatus(
        order,
        {
          orderStatus: 'RTO',
          rtoStatus: 'REQUESTED',
        },
        {
          actor: req.user?.email || 'Customer',
          actorType: 'CUSTOMER',
          reason: `Post-pickup cancellation requested: ${reason}. Package in transit to be returned to origin.`,
          source: 'RTO_INITIATED',
        }
      )

      return res.json({
        success: true,
        message: 'Cancellation requested. As your parcel was already picked up by courier, Return to Origin (RTO) has been initiated.',
        data: order,
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * 8. Check PIN Code Serviceability (Delhivery)
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
export const createRazorpayOrder = createPaymentOrder;
export { verifyPayment as verifyRazorpaySignature } from './payment.controller.js'
export { processRefund as refundRazorpayPayment } from './payment.controller.js'
