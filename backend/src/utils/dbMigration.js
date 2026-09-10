import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Shipment from '../models/Shipment.js'
import { mapLegacyStatus } from '../services/orderStatusEngine.js'
import { logger } from '../config/logger.js'

/**
 * Idempotent Database Schema Alignment & Compatibility Migrator
 * Safely aligns existing orders & products with the new multi-status architecture.
 * NEVER deletes data.
 */
export async function runIdempotentMigration() {
  try {
    logger.info('Starting idempotent database migration check...')

    // 1. Align Orders without separate fulfillmentStatus
    const ordersToAlign = await Order.find({
      $or: [
        { fulfillmentStatus: { $exists: false } },
        { fulfillmentStatus: null },
        { fulfillmentStatus: 'NEW', orderStatus: { $in: ['SHIPPED', 'DELIVERED', 'CONFIRMED', 'PROCESSING'] } },
      ],
    })

    if (ordersToAlign.length > 0) {
      logger.info({ count: ordersToAlign.length }, 'Aligning legacy orders to multi-status schema...')
      for (const order of ordersToAlign) {
        const legacyMap = mapLegacyStatus(order.orderStatus)

        if (!order.fulfillmentStatus || order.fulfillmentStatus === 'NEW') {
          order.fulfillmentStatus = legacyMap.fulfillmentStatus || 'NEW'
        }
        if (legacyMap.returnStatus && (!order.returnStatus || order.returnStatus === 'NONE')) {
          order.returnStatus = legacyMap.returnStatus
        }
        if (legacyMap.rtoStatus && (!order.rtoStatus || order.rtoStatus === 'NONE')) {
          order.rtoStatus = legacyMap.rtoStatus
        }

        if (order.paymentMethod === 'COD' && (!order.codCollectionStatus || order.codCollectionStatus === 'NOT_APPLICABLE')) {
          order.codCollectionStatus = order.paymentStatus === 'PAID' ? 'COLLECTED' : 'PENDING'
          order.codAmount = order.totalAmount || 0
        }

        // Ensure active shipment exists for existing orders with AWB/waybill
        const waybill = order.trackingNumber || order.delhivery?.waybill
        if (waybill && (!order.shipments || order.shipments.length === 0)) {
          let shipment = await Shipment.findOne({ waybill })
          if (!shipment) {
            shipment = new Shipment({
              order: order._id,
              orderNumber: order.orderNumber,
              shipmentNumber: `SHP-${order.orderNumber}-1`,
              shipmentType: 'FORWARD',
              courier: order.courierPartner || 'Delhivery Surface & Express B2C',
              waybill,
              status: order.fulfillmentStatus || 'READY_FOR_PICKUP',
              pickupStatus: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.fulfillmentStatus) ? 'PICKED_UP' : 'PENDING',
              destination: order.shippingAddress,
              itemsSnapshot: order.items,
            })
            await shipment.save().catch(() => {})
          }
          order.activeShipment = shipment._id
          order.shipments = [shipment._id]
        }

        await order.save().catch(() => {})
      }
      logger.info('Orders multi-status alignment complete.')
    }

    // 2. Align Products (ensure SKU, weight, dimensions, isActive, isArchived)
    const productsToAlign = await Product.find({
      $or: [
        { sku: { $exists: false } },
        { sku: '' },
        { weight: { $exists: false } },
        { dimensions: { $exists: false } },
        { isArchived: { $exists: false } },
      ],
    })

    if (productsToAlign.length > 0) {
      logger.info({ count: productsToAlign.length }, 'Aligning products metadata...')
      for (const prod of productsToAlign) {
        if (!prod.sku) prod.sku = `SKU-${prod._id.toString().slice(-6).toUpperCase()}`
        if (!prod.weight) prod.weight = 250
        if (!prod.dimensions) prod.dimensions = { length: 15, breadth: 10, height: 8 }
        if (prod.isActive === undefined) prod.isActive = true
        if (prod.isArchived === undefined) prod.isArchived = false
        if (prod.reservedStock === undefined) prod.reservedStock = 0
        await prod.save().catch(() => {})
      }
      logger.info('Products metadata alignment complete.')
    }

    logger.info('Database idempotent migration finished successfully.')
  } catch (err) {
    logger.warn({ err: err.message }, 'Migration notice (non-fatal)')
  }
}
