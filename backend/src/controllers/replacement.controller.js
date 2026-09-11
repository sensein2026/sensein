import Replacement from '../models/Replacement.js'
import Order from '../models/Order.js'
import SiteSettings from '../models/SiteSettings.js'
import AuditLog from '../models/AuditLog.js'
import { reserveStock, releaseReservation, convertReservation, restockReturnedUnit } from '../services/stockService.js'
import { createReversePickup, createForwardShipment, trackShipment } from '../services/delhiveryService.js'
import { initiateRefund } from '../services/razorpayService.js'
import { sendNotification } from '../services/notificationService.js'
import { sendSuccess, sendError, sendPaginated } from '../utils/responseEnvelope.js'
import { canTransitionReplacementStatus } from '../utils/statusTransitions.js'
import { checkOwnership } from '../middleware/auth.js'
import { logger } from '../config/logger.js'

/**
 * 1. Create Replacement Request (Customer)
 * POST /api/replacements
 */
export const createReplacementRequest = async (req, res, next) => {
  try {
    const { orderId, items, reason, customerComment, proofUrls = [] } = req.body

    if (!orderId) {
      return sendError(res, 'orderId is required to request a replacement.', 400, 'ORDER_ID_REQUIRED')
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one item must be selected for replacement.', 400, 'ITEMS_REQUIRED')
    }

    if (!reason) {
      return sendError(res, 'Replacement reason is required.', 400, 'REASON_REQUIRED')
    }

    // 1. Find Order
    const order = await Order.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
      ],
    })

    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    // Ownership check
    if (req.user && !checkOwnership(order.user, req.user)) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN')
    }

    // 2. Validate Order is in DELIVERED state
    if (order.orderStatus !== 'DELIVERED' && order.fulfillmentStatus !== 'DELIVERED') {
      return sendError(
        res,
        'Replacements can only be requested on DELIVERED orders.',
        400,
        'ORDER_NOT_DELIVERED'
      )
    }

    // 3. Validate Replacement Window from Order.deliveredAt
    const settings = (await SiteSettings.findOne()) || { replacementWindowDays: 7 }
    const windowDays = Number(settings.replacementWindowDays || 7)
    const deliveredAtTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime()
    const expiryTime = deliveredAtTime + windowDays * 24 * 60 * 60 * 1000

    if (Date.now() > expiryTime) {
      return sendError(
        res,
        `The ${windowDays}-day replacement window for this order has expired.`,
        400,
        'REPLACEMENT_WINDOW_EXPIRED'
      )
    }

    // 4. Validate Requested Quantities Against Remaining Eligible Quantity
    // Find all existing replacements for this order (excluding REJECTED and CANCELLED)
    const activeExistingReplacements = await Replacement.find({
      orderId: order._id,
      status: { $nin: ['REJECTED', 'CANCELLED'] },
    })

    const validatedItems = []

    for (const reqItem of items) {
      const prodId = String(reqItem.productId || reqItem.product || reqItem._id)
      const originalOrderItem = order.items.find((oi) => String(oi.product) === prodId || String(oi.productId) === prodId)

      if (!originalOrderItem) {
        return sendError(res, `Item ${prodId} was not part of original order.`, 400, 'INVALID_ITEM')
      }

      const purchasedQty = Number(originalOrderItem.qty || originalOrderItem.quantity || 1)

      // Calculate quantity already replaced or in-progress
      let alreadyReplacedQty = 0
      for (const rep of activeExistingReplacements) {
        for (const repItem of rep.items) {
          if (String(repItem.productId) === prodId && repItem.status !== 'REJECTED' && repItem.status !== 'CANCELLED') {
            alreadyReplacedQty += Number(repItem.replacementQty || 1)
          }
        }
      }

      const eligibleQty = purchasedQty - alreadyReplacedQty
      const requestedQty = Number(reqItem.replacementQty || reqItem.quantity || reqItem.qty || 1)

      if (requestedQty <= 0 || requestedQty > eligibleQty) {
        return sendError(
          res,
          `Cannot request ${requestedQty} units for "${originalOrderItem.productName || originalOrderItem.name}". Only ${eligibleQty} units are currently eligible for replacement.`,
          400,
          'EXCEEDS_ELIGIBLE_QUANTITY'
        )
      }

      validatedItems.push({
        itemId: originalOrderItem._id ? String(originalOrderItem._id) : prodId,
        productId: originalOrderItem.product || originalOrderItem.productId,
        productName: originalOrderItem.productName || originalOrderItem.name,
        variantId: originalOrderItem.variantId || null,
        variantName: originalOrderItem.variantName || '',
        sku: originalOrderItem.sku || '',
        image: originalOrderItem.image || '',
        unitPrice: originalOrderItem.unitPrice || originalOrderItem.price || 0,
        orderedQty: purchasedQty,
        replacementQty: requestedQty,
        status: 'REQUESTED',
      })
    }

    // 5. Generate Unique Replacement Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(100000 + Math.random() * 900000)
    const replacementNumber = `REP-${dateStr}-${randSuffix}`

    // 6. Create Replacement Document
    const replacement = await Replacement.create({
      replacementNumber,
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user || req.user?._id,
      customerName: order.shippingAddress?.fullName || req.user?.name || 'Customer',
      customerEmail: req.user?.email || order.customerEmail || 'customer@sensein.com',
      customerPhone: order.shippingAddress?.phone || order.customerPhone || '9265259954',
      items: validatedItems,
      reason,
      customerComment: customerComment || '',
      proofUrls: Array.isArray(proofUrls) ? proofUrls : [],
      status: 'REQUESTED',
      timeline: [
        {
          status: 'REQUESTED',
          note: `Customer requested replacement for ${validatedItems.length} item(s). Reason: ${reason}`,
          source: 'CUSTOMER',
          actor: req.user?.email || 'Customer',
          actorType: 'CUSTOMER',
          at: new Date(),
        },
      ],
    })

    // Update order reference without changing Order.orderStatus
    order.replacementStatus = 'REQUESTED'
    await order.save()

    // Send Notification
    sendNotification({
      userId: replacement.userId,
      orderId: order._id,
      replacementId: replacement._id,
      type: 'REPLACEMENT_REQUESTED',
      data: { replacementNumber, reason, itemsCount: validatedItems.length },
    }).catch(() => {})

    return sendSuccess(res, 'Replacement request submitted successfully', replacement, 201)
  } catch (error) {
    logger.error({ err: error.message }, 'createReplacementRequest error')
    return sendError(res, error.message || 'Failed to submit replacement request', 500, 'REPLACEMENT_CREATE_FAILED', error)
  }
}

/**
 * 2. Get Replacements (Customer: own | Admin: all with filters & pagination)
 * GET /api/replacements
 */
export const getReplacements = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')
    const { page = 1, limit = 20, status, search, orderNumber } = req.query

    const query = {}

    if (!isAdmin) {
      if (!req.user) {
        return sendError(res, 'Please log in to view replacements', 401, 'UNAUTHORIZED')
      }
      query.userId = req.user._id
    }

    if (status && status !== 'ALL') {
      query.status = status
    }

    if (orderNumber) {
      query.orderNumber = orderNumber
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { replacementNumber: regex },
        { orderNumber: regex },
        { customerName: regex },
        { customerEmail: regex },
        { reverseWaybill: regex },
        { replacementWaybill: regex },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [replacements, total] = await Promise.all([
      Replacement.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Replacement.countDocuments(query),
    ])

    return sendPaginated(res, 'Replacements retrieved successfully', replacements, page, limit, total)
  } catch (error) {
    return sendError(res, 'Failed to fetch replacements', 500, 'GET_REPLACEMENTS_ERROR', error)
  }
}

/**
 * 3. Get Single Replacement by ID / Number
 * GET /api/replacements/:id
 */
export const getReplacementById = async (req, res, next) => {
  try {
    const { id } = req.params
    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    }).populate('orderId')

    if (!replacement) {
      return sendError(res, 'Replacement request not found', 404, 'NOT_FOUND')
    }

    if (req.user && !checkOwnership(replacement.userId, req.user)) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN')
    }

    return sendSuccess(res, 'Replacement details', replacement)
  } catch (error) {
    return sendError(res, 'Failed to fetch replacement', 500, 'GET_REPLACEMENT_ERROR', error)
  }
}

/**
 * 4. Admin Approve Replacement
 * PATCH /api/replacements/:id/approve
 */
export const approveReplacement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { adminNote = 'Approved by operations team' } = req.body
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    if (replacement.status !== 'REQUESTED') {
      return sendError(
        res,
        `Cannot approve replacement in '${replacement.status}' status.`,
        400,
        'INVALID_STATUS'
      )
    }

    const order = await Order.findById(replacement.orderId)
    if (!order) {
      return sendError(res, 'Linked order not found', 404, 'ORDER_NOT_FOUND')
    }

    // 1. Validate Replacement Stock Availability & Reserve It
    const stockRes = await reserveStock({
      orderId: order._id,
      userId: replacement.userId,
      items: replacement.items,
      purpose: 'REPLACEMENT',
      replacementId: replacement._id,
      ttlMinutes: 7 * 24 * 60, // 7 days reservation for replacement turnaround
    })

    if (!stockRes.success) {
      return sendError(
        res,
        `Cannot approve replacement: ${stockRes.message}. (Hold for restock, substitute variant, or convert to refund-exception).`,
        400,
        'REPLACEMENT_OUT_OF_STOCK'
      )
    }

    // 2. Create Delhivery Reverse Pickup
    const pickupResult = await createReversePickup({
      replacement,
      order,
      idempotencyKey: idempotencyKey ? `rev_${idempotencyKey}` : null,
    })

    // 3. Check Settings for Dispatch Mode ('after_pickup' vs 'parallel')
    const settings = (await SiteSettings.findOne()) || { replacementDispatchMode: 'after_pickup' }
    const dispatchMode = replacement.dispatchModeOverride || settings.replacementDispatchMode || 'after_pickup'

    replacement.status = 'APPROVED'
    replacement.adminNote = adminNote
    for (const item of replacement.items) {
      item.status = 'APPROVED'
    }

    replacement.timeline.push({
      status: 'APPROVED',
      note: `Replacement approved. Reverse pickup scheduled (AWB: ${pickupResult.reverseWaybill || 'Assigned'}). Dispatch Mode: ${dispatchMode}`,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    // If parallel mode, dispatch replacement immediately
    let dispatchResult = null
    if (dispatchMode === 'parallel') {
      dispatchResult = await createForwardShipment({
        order,
        replacement,
        idempotencyKey: idempotencyKey ? `fwd_${idempotencyKey}` : null,
        isReplacementDispatch: true,
      })
      await convertReservation(replacement._id)
    }

    await replacement.save()

    await AuditLog.create({
      action: 'REPLACEMENT_APPROVED',
      actor: req.user?.email || 'admin',
      targetType: 'Replacement',
      targetId: replacement.replacementNumber,
      reason: adminNote,
      metadata: { reverseWaybill: pickupResult.reverseWaybill, dispatchMode },
    }).catch(() => {})

    sendNotification({
      userId: replacement.userId,
      orderId: order._id,
      replacementId: replacement._id,
      type: 'REPLACEMENT_APPROVED',
      data: { replacementNumber: replacement.replacementNumber, reverseWaybill: pickupResult.reverseWaybill },
    }).catch(() => {})

    return sendSuccess(res, 'Replacement approved and reverse pickup scheduled', {
      replacement,
      pickupResult,
      dispatchResult,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'approveReplacement error')
    return sendError(res, error.message || 'Failed to approve replacement', 500, 'APPROVE_FAILED', error)
  }
}

/**
 * 5. Admin Reject Replacement
 * PATCH /api/replacements/:id/reject
 */
export const rejectReplacement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rejectionReason } = req.body

    if (!rejectionReason) {
      return sendError(res, 'Mandatory rejection reason must be provided.', 400, 'REASON_REQUIRED')
    }

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    // Release any reserved stock
    await releaseReservation(replacement._id)

    replacement.status = 'REJECTED'
    replacement.rejectionReason = rejectionReason
    for (const item of replacement.items) {
      item.status = 'REJECTED'
    }

    replacement.timeline.push({
      status: 'REJECTED',
      note: `Replacement request rejected. Reason: ${rejectionReason}`,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    await replacement.save()

    await AuditLog.create({
      action: 'REPLACEMENT_REJECTED',
      actor: req.user?.email || 'admin',
      targetType: 'Replacement',
      targetId: replacement.replacementNumber,
      reason: rejectionReason,
      metadata: { rejectionReason },
    }).catch(() => {})

    sendNotification({
      userId: replacement.userId,
      orderId: replacement.orderId,
      replacementId: replacement._id,
      type: 'REPLACEMENT_REJECTED',
      data: { replacementNumber: replacement.replacementNumber, reason: rejectionReason },
    }).catch(() => {})

    return sendSuccess(res, 'Replacement request rejected', replacement)
  } catch (error) {
    return sendError(res, error.message, 500, 'REJECT_ERROR')
  }
}

/**
 * 6. Admin Record Quality Check (QC) on Returned Unit
 * PATCH /api/replacements/:id/qc
 */
export const recordReplacementQC = async (req, res, next) => {
  try {
    const { id } = req.params
    const { qcResult, qcNote = '', autoDispatch = true } = req.body

    if (!qcResult || !['GOOD', 'DAMAGED', 'DEFECTIVE'].includes(qcResult)) {
      return sendError(res, "qcResult must be one of: 'GOOD', 'DAMAGED', 'DEFECTIVE'", 400, 'INVALID_QC_RESULT')
    }

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    const isPassed = qcResult === 'GOOD'
    const targetStatus = isPassed ? 'QC_PASSED' : 'QC_FAILED'

    replacement.qcResult = qcResult
    replacement.qcNote = qcNote
    replacement.qcInspectedBy = req.user?._id || null
    replacement.qcInspectedAt = new Date()
    replacement.status = targetStatus

    for (const item of replacement.items) {
      item.status = targetStatus
    }

    // Restock or Quarantine the returned unit
    for (const item of replacement.items) {
      await restockReturnedUnit({
        orderId: replacement.orderId,
        replacementId: replacement._id,
        productId: item.productId,
        qty: item.replacementQty,
        disposition: isPassed ? 'QC_PASSED' : 'QC_FAILED',
        actor: req.user?.email || 'admin',
      })
    }

    replacement.timeline.push({
      status: targetStatus,
      note: `Warehouse QC inspection: ${qcResult}. Note: ${qcNote || 'Standard verification'}`,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    // If QC passed and not already dispatched, dispatch replacement unit
    let dispatchResult = null
    if (isPassed && autoDispatch && !replacement.replacementWaybill) {
      const order = await Order.findById(replacement.orderId)
      if (order) {
        dispatchResult = await createForwardShipment({
          order,
          replacement,
          isReplacementDispatch: true,
        })
        await convertReservation(replacement._id)
      }
    }

    await replacement.save()

    await AuditLog.create({
      action: 'REPLACEMENT_QC_RECORDED',
      actor: req.user?.email || 'admin',
      targetType: 'Replacement',
      targetId: replacement.replacementNumber,
      reason: `QC Inspection: ${qcResult}. ${qcNote}`,
      metadata: { qcResult, qcNote, isPassed },
    }).catch(() => {})

    return sendSuccess(res, `QC Inspection recorded: ${targetStatus}`, {
      replacement,
      dispatchResult,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'recordReplacementQC error')
    return sendError(res, error.message, 500, 'QC_ERROR', error)
  }
}

/**
 * 7. Admin Create Replacement Dispatch Shipment (Secondary Waybill)
 * POST /api/replacements/:id/shipment
 */
export const createReplacementDispatchShipment = async (req, res, next) => {
  try {
    const { id } = req.params
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    const order = await Order.findById(replacement.orderId)
    if (!order) {
      return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND')
    }

    const dispatchResult = await createForwardShipment({
      order,
      replacement,
      idempotencyKey,
      isReplacementDispatch: true,
    })

    // Convert reservation to permanent stock decrement
    await convertReservation(replacement._id)

    return sendSuccess(res, 'Replacement shipment created and dispatched', dispatchResult)
  } catch (error) {
    return sendError(res, error.message, 500, 'DISPATCH_ERROR')
  }
}

/**
 * 8. Admin / Superadmin Convert Replacement to Refund Exception
 * PATCH /api/replacements/:id/convert-to-refund
 */
export const convertToRefundException = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason = 'Replacement unavailable / converted to refund exception' } = req.body

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    const order = await Order.findById(replacement.orderId)
    if (!order) {
      return sendError(res, 'Linked order not found', 404, 'ORDER_NOT_FOUND')
    }

    // 1. Release reserved replacement stock
    await releaseReservation(replacement._id)

    // 2. Initiate Refund against original Order payment
    let refundResult = null
    if (order.paymentStatus === 'PAID') {
      refundResult = await initiateRefund({
        order,
        reason: `Replacement ${replacement.replacementNumber} exception converted to refund: ${reason}`,
        initiatedBy: req.user?.email || 'admin',
      })
    }

    replacement.status = 'CONVERTED_TO_REFUND'
    replacement.timeline.push({
      status: 'CONVERTED_TO_REFUND',
      note: `Replacement converted to financial refund exception. Reason: ${reason}`,
      source: 'ADMIN',
      actor: req.user?.email || 'admin',
      actorType: 'ADMIN',
      at: new Date(),
    })

    await replacement.save()

    await AuditLog.create({
      action: 'REPLACEMENT_CONVERTED_TO_REFUND',
      actor: req.user?.email || 'admin',
      targetType: 'Replacement',
      targetId: replacement.replacementNumber,
      reason,
      metadata: { orderId: order._id, refundResult },
    }).catch(() => {})

    return sendSuccess(res, 'Replacement converted to refund exception successfully', {
      replacement,
      refundResult,
    })
  } catch (error) {
    logger.error({ err: error.message }, 'convertToRefundException error')
    return sendError(res, error.message, 500, 'CONVERT_REFUND_ERROR')
  }
}

/**
 * 9. Cancel Replacement Request
 * PATCH /api/replacements/:id/cancel
 */
export const cancelReplacementRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason = 'Cancelled by user' } = req.body

    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    if (req.user && !checkOwnership(replacement.userId, req.user)) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN')
    }

    const cancellableStatuses = ['REQUESTED', 'APPROVED', 'REVERSE_PICKUP_SCHEDULED']
    if (!cancellableStatuses.includes(replacement.status)) {
      return sendError(
        res,
        `Cannot cancel replacement in '${replacement.status}' status. Pickup has already commenced.`,
        400,
        'CANNOT_CANCEL'
      )
    }

    // Release any reserved stock
    await releaseReservation(replacement._id)

    replacement.status = 'CANCELLED'
    for (const item of replacement.items) {
      item.status = 'CANCELLED'
    }

    replacement.timeline.push({
      status: 'CANCELLED',
      note: `Replacement request cancelled: ${reason}`,
      source: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      actor: req.user?.email || 'Customer',
      actorType: req.user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER',
      at: new Date(),
    })

    await replacement.save()

    return sendSuccess(res, 'Replacement cancelled successfully', replacement)
  } catch (error) {
    return sendError(res, error.message, 500, 'CANCEL_ERROR')
  }
}

/**
 * 10. Get Replacement Tracking
 * GET /api/replacements/:id/track
 */
export const getReplacementTracking = async (req, res, next) => {
  try {
    const { id } = req.params
    const replacement = await Replacement.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { replacementNumber: id },
      ],
    })

    if (!replacement) {
      return sendError(res, 'Replacement not found', 404, 'NOT_FOUND')
    }

    let reverseTracking = null
    if (replacement.reverseWaybill) {
      reverseTracking = await trackShipment(replacement.reverseWaybill)
    }

    let forwardTracking = null
    if (replacement.replacementWaybill) {
      forwardTracking = await trackShipment(replacement.replacementWaybill)
    }

    return sendSuccess(res, 'Replacement tracking details', {
      replacementNumber: replacement.replacementNumber,
      status: replacement.status,
      qcResult: replacement.qcResult,
      reverseWaybill: replacement.reverseWaybill,
      replacementWaybill: replacement.replacementWaybill,
      timeline: replacement.timeline,
      reverseTracking,
      forwardTracking,
    })
  } catch (error) {
    return sendError(res, 'Failed to fetch replacement tracking', 500, 'TRACKING_ERROR')
  }
}
