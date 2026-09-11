import Order from '../models/Order.js'
import Product from '../models/Product.js'
import AuditLog from '../models/AuditLog.js'
import { reserveStock, convertReservation, releaseReservation, restoreOrderStock } from '../services/stockService.js'
import { createForwardShipment, trackShipment, cancelShipment, checkPincodeServiceability } from '../services/delhiveryService.js'
import { initiateRefund } from '../services/razorpayService.js'
import { sendNotification } from '../services/notificationService.js'
import { sendSuccess, sendError, sendPaginated } from '../utils/responseEnvelope.js'
import { canTransitionOrderStatus } from '../utils/statusTransitions.js'
import { checkOwnership } from '../middleware/auth.js'
import { logger } from '../config/logger.js'

/**
 * 1. Create Order (Checkout for COD or Prepaid)
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod = 'COD',
      customerNotes,
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one item is required to place an order.', 400, 'INVALID_ITEMS')
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.city) {
      return sendError(res, 'Complete shipping address is required.', 400, 'INVALID_SHIPPING_ADDRESS')
    }

    // Server-side price & item snapshot calculation
    let calculatedSubtotal = 0
    const snapshotItems = []

    for (const item of items) {
      const prodId = item.productId || item.product || item._id
      const prod = await Product.findById(prodId)
      if (!prod || !prod.isActive) {
        return sendError(res, `Product "${item.name || prodId}" is currently unavailable.`, 400, 'PRODUCT_UNAVAILABLE')
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

    // Generate unique order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(100000 + Math.random() * 900000)
    const orderNumber = `SENSEIN-${dateStr}-${randSuffix}`

    const isCod = paymentMethod.toUpperCase() === 'COD'

    const order = await Order.create({
      orderNumber,
      user: req.user?._id || null,
      customerName: shippingAddress.fullName,
      customerEmail: req.user?.email || shippingAddress.email || 'customer@sensein.com',
      customerPhone: shippingAddress.phone,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1 || shippingAddress.addressLine || '',
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || 'Gujarat',
        pincode: shippingAddress.pincode || shippingAddress.postalCode || '395010',
        country: shippingAddress.country || 'India',
      },
      billingAddress: billingAddress || shippingAddress,
      items: snapshotItems,
      amountBreakdown: {
        subtotal: calculatedSubtotal,
        discount: 0,
        shippingCharge,
        tax: 0,
        totalAmount,
        paidAmount: isCod ? 0 : 0,
        refundableAmount: isCod ? 0 : 0,
        refundedAmount: 0,
        currency: 'INR',
      },
      subtotal: calculatedSubtotal,
      totalAmount,
      shippingFee: shippingCharge,
      paymentMethod: isCod ? 'COD' : 'RAZORPAY',
      paymentStatus: 'PENDING',
      collectionStatus: isCod ? 'PENDING' : 'NOT_APPLICABLE',
      codAmount: isCod ? totalAmount : 0,
      orderStatus: isCod ? 'CONFIRMED' : 'PLACED',
      fulfillmentStatus: isCod ? 'CONFIRMED' : 'NEW',
      timeline: [
        {
          status: isCod ? 'CONFIRMED' : 'PLACED',
          note: isCod
            ? `Order confirmed with Cash on Delivery (₹${totalAmount}).`
            : 'Order initiated, awaiting online payment.',
          source: 'SYSTEM',
          actor: 'Checkout Engine',
          actorType: 'SYSTEM',
        },
      ],
    })

    // Stock Reservation
    const resResult = await reserveStock({
      orderId: order._id,
      userId: req.user?._id,
      items: snapshotItems,
      purpose: 'ORDER_CHECKOUT',
    })

    if (!resResult.success) {
      await Order.findByIdAndDelete(order._id)
      return sendError(res, resResult.message || 'Items out of stock', 400, 'OUT_OF_STOCK')
    }

    // If COD, convert reservation to permanent stock decrement immediately
    if (isCod) {
      await convertReservation(order._id)
      sendNotification({
        userId: order.user,
        orderId: order._id,
        type: 'ORDER_CONFIRMED',
        data: { orderNumber: order.orderNumber, totalAmount },
      }).catch(() => {})
    }

    return sendSuccess(res, 'Order created successfully', order, 201)
  } catch (error) {
    logger.error({ err: error.message }, 'createOrder error')
    return sendError(res, error.message || 'Failed to place order', 500, 'ORDER_CREATION_FAILED', error)
  }
}

/**
 * 2. Get Orders (Customer: own orders | Admin: all with filters & pagination)
 * GET /api/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')
    const {
      page = 1,
      limit = 20,
      status,
      orderStatus,
      paymentStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const query = {}

    // Customer scoping: only view own orders
    if (!isAdmin) {
      if (!req.user) {
        return sendError(res, 'Please log in to view orders', 401, 'UNAUTHORIZED')
      }
      query.user = req.user._id
    }

    // Status filter
    const activeStatus = status || orderStatus
    if (activeStatus && activeStatus !== 'ALL') {
      query.orderStatus = activeStatus
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus
    }

    // Search query
    if (search) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerEmail: regex },
        { customerPhone: regex },
        { waybill: regex },
        { trackingNumber: regex },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ])

    return sendPaginated(res, 'Orders retrieved successfully', orders, page, limit, total)
  } catch (error) {
    logger.error({ err: error.message }, 'getOrders error')
    return sendError(res, 'Failed to fetch orders', 500, 'GET_ORDERS_ERROR', error)
  }
}

/**
 * 3. Get Single Order by ID / Order Number
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

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Ownership check: customer can only view own order
    if (req.user && !checkOwnership(order.user, req.user)) {
      return sendError(res, 'You do not have permission to view this order', 403, 'FORBIDDEN')
    }

    return sendSuccess(res, 'Order details retrieved', order)
  } catch (error) {
    return sendError(res, 'Failed to fetch order', 500, 'GET_ORDER_ERROR', error)
  }
}

/**
 * 4. Get Order Tracking Timeline
 * GET /api/orders/:id/track or GET /api/orders/:id/tracking
 */
export const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // If order has a waybill, attempt live courier track
    let liveTracking = null
    if (order.waybill) {
      liveTracking = await trackShipment(order.waybill)
    }

    return sendSuccess(res, 'Order tracking details', {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      waybill: order.waybill,
      deliveredAt: order.deliveredAt,
      timeline: order.timeline,
      trackingHistory: order.trackingHistory,
      liveCourierTracking: liveTracking,
    })
  } catch (error) {
    return sendError(res, 'Failed to fetch tracking details', 500, 'GET_TRACKING_ERROR', error)
  }
}

/**
 * 5. Cancel Order (Customer or Admin pre-shipment cancellation)
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason = 'Customer requested cancellation' } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Ownership check
    if (req.user && !checkOwnership(order.user, req.user)) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN')
    }

    // Cancellation check: Only allowed while PLACED, CONFIRMED, or PACKED (before physical courier dispatch)
    const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PACKED', 'ACTIVE', 'NEW', 'PROCESSING']
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return sendError(
        res,
        `Order cannot be cancelled in '${order.orderStatus}' status. Package has already shipped.`,
        409,
        'ORDER_CANNOT_BE_CANCELLED'
      )
    }

    // 1. Cancel Delhivery shipment if waybill was created
    if (order.waybill) {
      await cancelShipment(order.waybill)
    }

    // 2. Release StockReservation or Restore Real Stock (Double-restock protected)
    if (order.paymentStatus === 'PAID' || order.paymentMethod === 'COD') {
      await restoreOrderStock(order, req.user?.email || 'Customer', reason)
    } else {
      await releaseReservation(order._id)
    }

    // 3. Mark CANCELLED
    order.orderStatus = 'CANCELLED'
    order.fulfillmentStatus = 'CANCELLED'
    order.cancelledAt = new Date()
    order.cancelledBy = req.user?.email || 'Customer'
    order.cancellationReason = reason

    order.timeline.push({
      status: 'CANCELLED',
      note: `Order cancelled. Reason: ${reason}`,
      source: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      actor: req.user?.email || 'Customer',
      actorType: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      at: new Date(),
    })

    await order.save()

    // 4. Auto-initiate refund if paid online
    let refundInfo = null
    if (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'PAID') {
      try {
        refundInfo = await initiateRefund({
          order,
          reason: `Auto refund on order cancellation: ${reason}`,
          initiatedBy: 'system',
        })
      } catch (refundErr) {
        logger.error({ err: refundErr.message, orderNumber: order.orderNumber }, 'Auto-refund on cancel failed')
      }
    }

    // 5. Send Notification
    sendNotification({
      userId: order.user,
      orderId: order._id,
      type: 'ORDER_CANCELLED',
      data: { orderNumber: order.orderNumber, reason, refundInitiated: Boolean(refundInfo) },
    }).catch(() => {})

    return sendSuccess(res, 'Order cancelled successfully', {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      refundInfo,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'cancelOrder error')
    return sendError(res, error.message || 'Failed to cancel order', 500, 'CANCEL_ERROR', error)
  }
}

/**
 * 6. Admin Create Forward Shipment (Idempotent)
 * POST /api/orders/:id/shipment
 */
export const createShipmentForOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    if (order.orderStatus === 'CANCELLED') {
      return sendError(res, 'Cannot create shipment for a cancelled order', 400, 'ORDER_CANCELLED')
    }

    const shipmentResult = await createForwardShipment({
      order,
      idempotencyKey,
      isReplacementDispatch: false,
    })

    await AuditLog.create({
      action: 'SHIPMENT_CREATED',
      actor: req.user?.email || 'admin',
      targetType: 'Order',
      targetId: order.orderNumber,
      reason: `Forward shipment created. Waybill: ${shipmentResult.waybill}`,
      metadata: { waybill: shipmentResult.waybill },
    }).catch(() => {})

    return sendSuccess(res, shipmentResult.message, shipmentResult)
  } catch (error) {
    logger.error({ err: error.message }, 'createShipmentForOrder error')
    return sendError(res, error.message || 'Failed to create shipment', 500, 'SHIPMENT_CREATION_FAILED', error)
  }
}

/**
 * 7. Admin Update Order Status (Validated against allowed-transitions map)
 * PATCH /api/orders/:id/status or PUT /api/orders/:id/status
 */
export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const { orderStatus, reason = 'Admin status update' } = req.body

    if (!orderStatus) {
      return sendError(res, 'orderStatus is required', 400, 'STATUS_REQUIRED')
    }

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Validate allowed transition
    const isValidTransition = canTransitionOrderStatus(order.orderStatus, orderStatus)
    if (!isValidTransition) {
      return sendError(
        res,
        `Illegal status transition from '${order.orderStatus}' to '${orderStatus}'. This transition is rejected by policy.`,
        400,
        'ILLEGAL_STATUS_TRANSITION'
      )
    }

    const previousStatus = order.orderStatus
    order.orderStatus = orderStatus

    if (orderStatus === 'DELIVERED') {
      order.deliveredAt = new Date()
      order.fulfillmentStatus = 'DELIVERED'
    }

    order.timeline.push({
      status: orderStatus,
      note: reason,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    await order.save()

    await AuditLog.create({
      action: 'STATUS_OVERRIDE',
      actor: req.user?.email || 'admin',
      targetType: 'Order',
      targetId: order.orderNumber,
      reason,
      metadata: { previousStatus, newStatus: orderStatus },
    }).catch(() => {})

    return sendSuccess(res, `Order status updated to '${orderStatus}'`, order)
  } catch (error) {
    return sendError(res, error.message || 'Failed to update order status', 500, 'UPDATE_STATUS_ERROR', error)
  }
}

/**
 * 8. Admin Confirm COD Remittance
 * POST /api/orders/:id/cod-remittance
 */
export const confirmCodRemittance = async (req, res, next) => {
  try {
    const { id } = req.params
    const { remittanceReference = '', notes = '' } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    if (order.paymentMethod !== 'COD') {
      return sendError(res, 'This order is not a Cash on Delivery order.', 400, 'NOT_COD_ORDER')
    }

    order.collectionStatus = 'REMITTED'
    order.paymentStatus = 'PAID'
    order.codRemittedAt = new Date()
    order.codCollectionReference = remittanceReference

    order.timeline.push({
      status: 'COD_REMITTED',
      note: `Courier COD cash remittance confirmed: ₹${order.codAmount}. Ref: ${remittanceReference}`,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    await order.save()

    await AuditLog.create({
      action: 'COD_REMITTANCE_CONFIRMED',
      actor: req.user?.email || 'admin',
      targetType: 'Order',
      targetId: order.orderNumber,
      reason: `Marked COD remitted with ref: ${remittanceReference}`,
      metadata: { amount: order.codAmount, remittanceReference, notes },
    }).catch(() => {})

    return sendSuccess(res, 'COD remittance confirmed successfully', order)
  } catch (error) {
    return sendError(res, error.message, 500, 'COD_REMITTANCE_ERROR')
  }
}

/**
 * 9. Admin RTO QC Inspection & Idempotent Restock Confirmation
 * POST /api/orders/:id/restock
 */
export const restockRtoOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { disposition = 'SELLABLE', reason = 'RTO package received at warehouse' } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Double-restock protection
    if (order.restockStatus === 'RESTOCKED') {
      return sendError(res, 'This order package has already been restocked.', 409, 'ALREADY_RESTOCKED')
    }

    if (disposition === 'SELLABLE') {
      await restoreOrderStock(order, req.user?.email || 'admin', reason)
    } else {
      order.restockStatus = disposition
      order.restockedAt = new Date()
      order.restockedBy = req.user?.email || 'admin'
      await order.save()
    }

    return sendSuccess(res, `RTO inspection complete: items marked ${disposition}`, order)
  } catch (error) {
    return sendError(res, error.message, 500, 'RESTOCK_ERROR')
  }
}

/**
 * 10. Check Pincode Serviceability
 * GET /api/orders/pincode-check/:code
 */
export const checkPincodeServiceabilityController = async (req, res, next) => {
  try {
    const { code } = req.params
    const result = await checkPincodeServiceability(code)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ serviceable: false, message: error.message })
  }
}

/**
 * 11. Update Order Delivery Address (Before physical courier pickup)
 * PUT /api/orders/:id/address or PATCH /api/orders/:id/address
 */
export const updateOrderAddress = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      fullName,
      phone,
      addressLine,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      pincode,
      country = 'India',
      reason = 'Customer corrected shipping address',
    } = req.body

    const order = await Order.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderNumber: id },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    if (req.user && !checkOwnership(order.user, req.user)) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN')
    }

    // Locked status check: Only allowed before physical courier pickup
    const lockedStatuses = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO_INITIATED', 'RTO_DELIVERED']
    if (lockedStatuses.includes(order.orderStatus)) {
      return sendError(
        res,
        `Address cannot be updated after order has reached '${order.orderStatus}' status.`,
        400,
        'ADDRESS_LOCKED'
      )
    }

    const previousAddress = { ...(order.shippingAddress?.toObject?.() || order.shippingAddress) }

    const newAddressLine = addressLine1 || addressLine || order.shippingAddress?.addressLine1 || ''
    const newCity = city || order.shippingAddress?.city || 'Surat'
    const newState = state || order.shippingAddress?.state || 'Gujarat'
    const newPincode = pincode || postalCode || order.shippingAddress?.pincode || order.shippingAddress?.postalCode || '395010'
    const newFullName = fullName || order.shippingAddress?.fullName || order.customerName || 'Customer'
    const newPhone = phone || order.shippingAddress?.phone || order.customerPhone || '9265259954'

    order.shippingAddress = {
      fullName: newFullName,
      phone: newPhone,
      addressLine1: newAddressLine,
      addressLine2: addressLine2 || '',
      addressLine: newAddressLine,
      city: newCity,
      state: newState,
      pincode: newPincode,
      postalCode: newPincode,
      country,
    }

    order.customerName = newFullName
    order.customerPhone = newPhone

    order.timeline.push({
      status: 'ADDRESS_UPDATED',
      note: `Delivery address updated: ${newAddressLine}, ${newCity}, ${newState} - ${newPincode}`,
      source: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      actor: req.user?.email || 'Customer',
      actorType: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      at: new Date(),
    })

    await order.save()

    await AuditLog.create({
      action: 'ADDRESS_UPDATED',
      actor: req.user?.email || 'Customer',
      targetType: 'Order',
      targetId: order.orderNumber,
      reason,
      metadata: { previousAddress, updatedAddress: order.shippingAddress },
    }).catch(() => {})

    return sendSuccess(res, 'Order delivery address updated successfully', order)
  } catch (error) {
    logger.error({ err: error.message }, 'updateOrderAddress error')
    return sendError(res, error.message || 'Failed to update order address', 500, 'ADDRESS_UPDATE_ERROR', error)
  }
}

/**
 * 12. Public Track Orders by Query (Order Number, Phone, or AWB)
 * GET /api/orders/track?query=...
 */
export const trackOrder = async (req, res, next) => {
  try {
    const rawQuery = (req.query.query || req.query.q || req.query.number || req.query.waybill || '').trim()

    if (!rawQuery) {
      return sendSuccess(res, 'Please enter an order number or AWB', [])
    }

    const cleanQuery = rawQuery.replace(/^[#]/, '').trim()
    const regex = new RegExp(`^${cleanQuery}$|${cleanQuery}`, 'i')

    const orders = await Order.find({
      $or: [
        { orderNumber: regex },
        { trackingNumber: cleanQuery },
        { waybill: cleanQuery },
        { 'delhivery.waybill': cleanQuery },
        { customerPhone: cleanQuery },
        { 'shippingAddress.phone': cleanQuery },
      ],
    }).sort({ createdAt: -1 }).limit(5)

    if (orders.length === 0) {
      return sendSuccess(res, 'No shipments found matching query', [])
    }

    return sendSuccess(res, `Found ${orders.length} order(s)`, orders)
  } catch (error) {
    logger.error({ err: error.message }, 'trackOrder error')
    return sendError(res, error.message || 'Tracking search error', 500, 'TRACK_SEARCH_ERROR', error)
  }
}


