import AuditLog from '../models/AuditLog.js'
import { logger } from '../config/logger.js'

/**
 * Permitted Fulfillment Status Transitions Matrix
 */
export const ALLOWED_FULFILLMENT_TRANSITIONS = {
  NEW: ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPMENT_CREATED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PACKED', 'SHIPMENT_CREATED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'SHIPMENT_CREATED', 'LABEL_GENERATED', 'READY_FOR_PICKUP', 'CANCELLED'],
  PACKED: ['SHIPMENT_CREATED', 'LABEL_GENERATED', 'READY_FOR_PICKUP', 'CANCELLED'],
  SHIPMENT_CREATED: ['LABEL_GENERATED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'],
  LABEL_GENERATED: ['READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'IN_TRANSIT'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'IN_TRANSIT'],
  DELIVERED: [], // Terminal forward state
  CANCELLED: [],
}

/**
 * Check if Address Editing is permitted for the given order.
 * Strictly allowed only BEFORE physical courier pickup.
 */
export function isAddressEditAllowed(order) {
  if (!order) return false
  if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'RTO' || order.orderStatus === 'RETURN') {
    return false
  }

  const lockedFulfillment = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
  const currentFulfillment = order.fulfillmentStatus || order.orderStatus
  if (lockedFulfillment.includes(currentFulfillment)) {
    return false
  }

  return true
}

/**
 * Check if Order Cancellation is permitted before pickup.
 */
export function isPrePickupCancellationAllowed(order) {
  if (!order) return false
  if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'COMPLETED') {
    return false
  }
  const lockedFulfillment = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']
  const currentFulfillment = order.fulfillmentStatus || order.orderStatus
  return !lockedFulfillment.includes(currentFulfillment)
}

/**
 * Map legacy status strings to new separate status fields for backward compatibility
 */
export function mapLegacyStatus(legacyStatus) {
  const s = (legacyStatus || '').toUpperCase().trim()
  switch (s) {
    case 'PENDING':
    case 'PLACED':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'NEW' }
    case 'CONFIRMED':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'CONFIRMED' }
    case 'PROCESSING':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'PROCESSING' }
    case 'PACKED':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'PACKED' }
    case 'SHIPPED':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'SHIPMENT_CREATED' }
    case 'IN_TRANSIT':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'IN_TRANSIT' }
    case 'OUT_FOR_DELIVERY':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'OUT_FOR_DELIVERY' }
    case 'DELIVERED':
      return { orderStatus: 'ACTIVE', fulfillmentStatus: 'DELIVERED' }
    case 'CANCELLED':
      return { orderStatus: 'CANCELLED', fulfillmentStatus: 'CANCELLED' }
    case 'RETURNED':
      return { orderStatus: 'RETURN', returnStatus: 'RECEIVED' }
    case 'RTO':
      return { orderStatus: 'RTO', rtoStatus: 'IN_TRANSIT' }
    default:
      return { orderStatus: 'ACTIVE' }
  }
}

/**
 * Central state transition engine. Validates and applies state updates,
 * generating immutable timeline events and audit logs.
 */
export async function transitionOrderStatus(order, targetUpdates, context = {}) {
  const {
    actor = 'SYSTEM',
    actorType = 'SYSTEM',
    reason = '',
    source = 'API',
    externalEventId = '',
    metadata = {},
  } = context

  const previousState = {
    orderStatus: order.orderStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatus: order.paymentStatus,
    codCollectionStatus: order.codCollectionStatus,
    returnStatus: order.returnStatus,
    replacementStatus: order.replacementStatus,
    rtoStatus: order.rtoStatus,
    refundStatus: order.refundStatus,
  }

  // Validate fulfillment transitions if updating fulfillmentStatus
  if (targetUpdates.fulfillmentStatus && targetUpdates.fulfillmentStatus !== order.fulfillmentStatus) {
    const current = order.fulfillmentStatus || 'NEW'
    const next = targetUpdates.fulfillmentStatus
    const allowed = ALLOWED_FULFILLMENT_TRANSITIONS[current] || []

    // Allow Admin override if explicitly stated in actorType, else validate matrix
    if (actorType !== 'ADMIN' && !allowed.includes(next)) {
      const err = new Error(`Invalid fulfillment status transition from '${current}' to '${next}'`)
      err.statusCode = 400
      throw err
    }

    order.fulfillmentStatus = next
  }

  if (targetUpdates.orderStatus) order.orderStatus = targetUpdates.orderStatus
  if (targetUpdates.paymentStatus) order.paymentStatus = targetUpdates.paymentStatus
  if (targetUpdates.codCollectionStatus) order.codCollectionStatus = targetUpdates.codCollectionStatus
  if (targetUpdates.codAmount !== undefined) order.codAmount = targetUpdates.codAmount
  if (targetUpdates.codCollectedAt) order.codCollectedAt = targetUpdates.codCollectedAt
  if (targetUpdates.codCollectionReference) order.codCollectionReference = targetUpdates.codCollectionReference
  if (targetUpdates.returnStatus) order.returnStatus = targetUpdates.returnStatus
  if (targetUpdates.replacementStatus) order.replacementStatus = targetUpdates.replacementStatus
  if (targetUpdates.rtoStatus) order.rtoStatus = targetUpdates.rtoStatus
  if (targetUpdates.refundStatus) order.refundStatus = targetUpdates.refundStatus
  if (targetUpdates.trackingNumber) order.trackingNumber = targetUpdates.trackingNumber
  if (targetUpdates.courierPartner) order.courierPartner = targetUpdates.courierPartner

  const newStatusLabel =
    targetUpdates.fulfillmentStatus ||
    targetUpdates.orderStatus ||
    targetUpdates.paymentStatus ||
    'UPDATED'

  // Create immutable timeline event
  if (!Array.isArray(order.timeline)) order.timeline = []
  order.timeline.push({
    orderId: order.orderNumber,
    previousStatus: previousState.fulfillmentStatus || previousState.orderStatus,
    newStatus: newStatusLabel,
    timestamp: new Date(),
    actor,
    actorType,
    reason,
    source,
    externalEventId,
    metadata,
  })

  // Synchronize customer-facing tracking history
  if (!Array.isArray(order.trackingHistory)) order.trackingHistory = []
  const customerTitle = getCustomerFriendlyTitle(newStatusLabel, order.courierPartner)
  order.trackingHistory.unshift({
    status: newStatusLabel,
    title: customerTitle.title,
    location: customerTitle.location,
    timestamp: new Date(),
    description: reason || customerTitle.description,
  })

  // Create system audit log
  try {
    await AuditLog.create({
      action: 'UPDATE',
      entityType: 'Order',
      entityId: order._id.toString(),
      title: `Order ${order.orderNumber} transitioned to ${newStatusLabel}`,
      details: {
        previousState,
        newState: {
          orderStatus: order.orderStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          paymentStatus: order.paymentStatus,
          codCollectionStatus: order.codCollectionStatus,
        },
        actor,
        actorType,
        reason,
        source,
        externalEventId,
      },
      performerEmail: actorType === 'ADMIN' ? actor : 'system@sensein.com',
    })
  } catch (auditErr) {
    logger.warn({ err: auditErr.message }, 'Failed to record audit log for order transition')
  }

  await order.save()
  return order
}

function getCustomerFriendlyTitle(status, courier = 'Delhivery Express') {
  switch (status) {
    case 'NEW':
    case 'ORDER_PLACED':
      return { title: 'Order Placed', location: 'Sensein Flagship', description: 'Your order has been registered successfully.' }
    case 'CONFIRMED':
      return { title: 'Order Confirmed', location: 'Sensein Operations', description: 'Your order has been confirmed and verified for packaging.' }
    case 'PROCESSING':
      return { title: 'Formulation & Packaging', location: 'Sensein Botanical Lab', description: 'Botanical formulation and luxury packaging in progress.' }
    case 'PACKED':
      return { title: 'Packed & Ready', location: 'Sensein Warehouse, Surat', description: 'Package is packed and waiting for courier dispatch.' }
    case 'SHIPMENT_CREATED':
    case 'LABEL_GENERATED':
    case 'READY_FOR_PICKUP':
      return { title: 'Manifested with Courier', location: 'Surat Central Hub', description: `Courier shipment generated with ${courier}. Ready for physical pickup.` }
    case 'PICKED_UP':
      return { title: `Picked Up by ${courier}`, location: 'Surat Logistics Hub', description: 'Courier partner has physically collected the parcel.' }
    case 'IN_TRANSIT':
      return { title: 'In Transit', location: 'En Route to Destination Hub', description: 'Your package is on the way.' }
    case 'OUT_FOR_DELIVERY':
      return { title: 'Out for Doorstep Delivery', location: 'Local Delivery Center', description: 'Shipment is out with rider for delivery today.' }
    case 'DELIVERED':
      return { title: 'Delivered Successfully', location: 'Destination Address', description: 'Package handed over safely.' }
    case 'CANCELLED':
      return { title: 'Order Cancelled', location: 'Sensein Operations', description: 'Order has been cancelled.' }
    default:
      return { title: `Status: ${status}`, location: 'Sensein Logistics', description: 'Shipment milestone updated.' }
  }
}
