import Product from '../models/Product.js'
import StockReservation from '../models/StockReservation.js'
import AuditLog from '../models/AuditLog.js'
import { logger } from '../config/logger.js'

/**
 * 1. Reserve Stock for Checkout or Replacement
 * Atomically increments Product.reservedStock with stock availability condition.
 */
export async function reserveStock({
  orderId = null,
  userId = null,
  items = [],
  purpose = 'ORDER_CHECKOUT',
  replacementId = null,
  ttlMinutes = 30,
}) {
  if (!items || items.length === 0) {
    throw new Error('No items provided for stock reservation')
  }

  const reservationKey = `res_${purpose.toLowerCase()}_${orderId || replacementId || Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const reservedItemsSuccess = []

  try {
    for (const item of items) {
      const prodId = item.productId || item.product
      const qty = Number(item.quantity || item.qty || item.replacementQty || 1)

      // Single atomic operation: only reserve if available stock (stock - reservedStock) >= qty
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: prodId,
          $expr: {
            $gte: [{ $subtract: ['$stock', '$reservedStock'] }, qty],
          },
        },
        {
          $inc: { reservedStock: qty },
        },
        { new: true }
      )

      if (!updatedProduct) {
        // Find product to give descriptive error message
        const prod = await Product.findById(prodId)
        const available = Math.max(0, (prod?.stock || 0) - (prod?.reservedStock || 0))
        throw new Error(
          `Insufficient stock for "${prod?.name || 'Product'}". Available: ${available}, Requested: ${qty}`
        )
      }

      reservedItemsSuccess.push({
        productId: prodId,
        variantId: item.variantId || null,
        quantity: qty,
      })
    }

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    const reservation = await StockReservation.create({
      reservationKey,
      orderId,
      userId,
      purpose,
      replacementId,
      items: reservedItemsSuccess,
      status: 'ACTIVE',
      expiresAt,
    })

    return {
      success: true,
      reservationKey,
      reservation,
    }
  } catch (error) {
    // Roll back already reserved items
    for (const resItem of reservedItemsSuccess) {
      await Product.findByIdAndUpdate(resItem.productId, {
        $inc: { reservedStock: -resItem.quantity },
      }).catch((e) => logger.error({ err: e.message }, 'Failed to rollback reserved stock'))
    }

    logger.warn({ error: error.message, orderId }, 'Stock reservation failed')
    return {
      success: false,
      message: error.message,
    }
  }
}

/**
 * 2. Convert Stock Reservation on Payment Success / Order Confirmation
 * Atomically decrements real stock and decrements reservedStock.
 */
export async function convertReservation(reservationKeyOrOrderId, session = null) {
  let reservation = await StockReservation.findOne({
    $or: [{ reservationKey: reservationKeyOrOrderId }, { orderId: reservationKeyOrOrderId }],
    status: 'ACTIVE',
  })

  if (!reservation) {
    logger.warn({ reservationKeyOrOrderId }, 'No ACTIVE reservation found to convert')
    return { success: false, message: 'Reservation not found or already converted' }
  }

  for (const item of reservation.items) {
    await Product.findByIdAndUpdate(
      item.productId,
      {
        $inc: {
          stock: -item.quantity,
          reservedStock: -item.quantity,
        },
      },
      { session }
    )
  }

  reservation.status = 'CONVERTED'
  await reservation.save({ session })

  return { success: true, reservation }
}

/**
 * 3. Release Stock Reservation on Expiration or Pre-Payment Cancellation
 * Reverts reservedStock without touching real stock.
 */
export async function releaseReservation(reservationKeyOrOrderId, session = null) {
  let reservation = await StockReservation.findOne({
    $or: [{ reservationKey: reservationKeyOrOrderId }, { orderId: reservationKeyOrOrderId }],
    status: 'ACTIVE',
  })

  if (!reservation) {
    return { success: false, message: 'No ACTIVE reservation to release' }
  }

  for (const item of reservation.items) {
    await Product.findByIdAndUpdate(
      item.productId,
      {
        $inc: { reservedStock: -item.quantity },
      },
      { session }
    )
  }

  reservation.status = 'RELEASED'
  reservation.releasedAt = new Date()
  await reservation.save({ session })

  return { success: true, reservation }
}

/**
 * 4. Restore Real Stock on Order Cancellation after Confirmation
 * Includes double-restock protection.
 */
export async function restoreOrderStock(order, actor = 'system', reason = 'Order Cancellation') {
  if (order.restockStatus === 'RESTOCKED') {
    return { success: true, message: 'Order items have already been restocked (double-restock prevented)' }
  }

  for (const item of order.items || []) {
    const prodId = item.productId || item.product
    const qty = Number(item.qty || item.quantity || 1)
    if (prodId && qty > 0) {
      await Product.findByIdAndUpdate(prodId, {
        $inc: { stock: qty },
      })
    }
  }

  order.restockStatus = 'RESTOCKED'
  order.restockedAt = new Date()
  order.restockedBy = actor
  await order.save()

  await AuditLog.create({
    action: 'RESTOCK',
    actor,
    targetType: 'Order',
    targetId: order.orderNumber,
    reason: `Restocked ${order.items?.length || 0} items due to: ${reason}`,
    metadata: { orderId: order._id, items: order.items },
  }).catch(() => {})

  return { success: true, message: 'Order items restocked successfully' }
}

/**
 * 5. Restock Returned / RTO unit based on QC Disposition
 */
export async function restockReturnedUnit({
  orderId = null,
  replacementId = null,
  productId,
  qty = 1,
  disposition = 'QC_PASSED',
  actor = 'admin',
}) {
  if (disposition === 'QC_PASSED' || disposition === 'SELLABLE') {
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: qty },
    })

    await AuditLog.create({
      action: 'RESTOCK_QC_PASSED',
      actor,
      targetType: replacementId ? 'Replacement' : 'Order',
      targetId: String(replacementId || orderId),
      reason: `Returned unit passed QC inspection (${disposition}) and was returned to sellable stock.`,
      metadata: { productId, qty, disposition },
    }).catch(() => {})

    return { success: true, restocked: true, message: 'Unit returned to sellable stock' }
  } else {
    await AuditLog.create({
      action: 'QUARANTINE_QC_FAILED',
      actor,
      targetType: replacementId ? 'Replacement' : 'Order',
      targetId: String(replacementId || orderId),
      reason: `Returned unit marked ${disposition}. Routed to quarantine/damaged inventory (not added to sellable stock).`,
      metadata: { productId, qty, disposition },
    }).catch(() => {})

    return { success: true, restocked: false, message: 'Unit routed to damaged inventory bucket' }
  }
}

// Backward compatibility alias for legacy return controller
export const restockFromQC = restockReturnedUnit

