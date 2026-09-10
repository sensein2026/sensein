import Product from '../models/Product.js'
import { logger } from '../config/logger.js'

/**
 * Reserve stock when order is placed or COD confirmed
 * Uses atomic MongoDB operations.
 */
export async function reserveStock(items) {
  if (!items || !Array.isArray(items)) return { success: true }

  for (const item of items) {
    const prodId = item.product?._id || item.product?.id || item.product
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

    if (prodId) {
      try {
        await Product.findByIdAndUpdate(prodId, {
          $inc: { reservedStock: qty },
        })
      } catch (err) {
        logger.error({ err: err.message, prodId }, 'Error reserving stock')
      }
    }
  }
  return { success: true }
}

/**
 * Release reserved stock on order cancellation or payment failure
 */
export async function releaseStock(items) {
  if (!items || !Array.isArray(items)) return { success: true }

  for (const item of items) {
    const prodId = item.product?._id || item.product?.id || item.product
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

    if (prodId) {
      try {
        const prod = await Product.findById(prodId)
        if (prod) {
          const newReserved = Math.max(0, (prod.reservedStock || 0) - qty)
          prod.reservedStock = newReserved
          await prod.save()
        }
      } catch (err) {
        logger.error({ err: err.message, prodId }, 'Error releasing stock')
      }
    }
  }
  return { success: true }
}

/**
 * Commit stock deduction on order packaging / dispatch
 * Decrements actual stock and clears reserved count
 */
export async function commitStock(items) {
  if (!items || !Array.isArray(items)) return { success: true }

  for (const item of items) {
    const prodId = item.product?._id || item.product?.id || item.product
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

    if (prodId) {
      try {
        const prod = await Product.findById(prodId)
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - qty)
          prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - qty)
          await prod.save()
        }
      } catch (err) {
        logger.error({ err: err.message, prodId }, 'Error committing stock')
      }
    }
  }
  return { success: true }
}

/**
 * Restock product from Return QC.
 * ONLY restocks if QC disposition is 'SELLABLE'.
 */
export async function restockFromQC(items, disposition) {
  if (disposition !== 'SELLABLE' || !items || !Array.isArray(items)) {
    return { success: true, restocked: false, reason: `QC disposition is ${disposition}, items not added to sellable stock` }
  }

  for (const item of items) {
    const prodId = item.product?._id || item.product?.id || item.product
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1)

    if (prodId) {
      try {
        await Product.findByIdAndUpdate(prodId, {
          $inc: { stock: qty },
        })
      } catch (err) {
        logger.error({ err: err.message, prodId }, 'Error restocking from QC')
      }
    }
  }

  return { success: true, restocked: true }
}
