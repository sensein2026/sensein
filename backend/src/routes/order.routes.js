import { Router } from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  createShipmentForOrder,
  updateOrderStatusAdmin,
  confirmCodRemittance,
  restockRtoOrder,
  checkPincodeServiceabilityController,
  updateOrderAddress,
  trackOrder,
} from '../controllers/order.controller.js'
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js'
import { requireIdempotency } from '../middleware/idempotencyKey.js'

const router = Router()

// Pincode serviceability check
router.get('/pincode-check/:code', checkPincodeServiceabilityController)
router.get('/check-pincode/:code', checkPincodeServiceabilityController)

// Public Live Search Tracking
router.get('/track', trackOrder)

// Customer & Admin Orders List
router.get('/', optionalAuth, getOrders)
router.get('/my-orders', protect, getOrders)

// Place Order
router.post('/', optionalAuth, createOrder)

// Order Details & Tracking
router.get('/:id/track', getOrderTracking)
router.get('/:id/tracking', getOrderTracking)
router.get('/:id', optionalAuth, getOrderById)

// Cancellation & Address Edit
router.post('/:id/cancel', optionalAuth, cancelOrder)
router.put('/:id/address', optionalAuth, updateOrderAddress)
router.patch('/:id/address', optionalAuth, updateOrderAddress)

// Admin Actions
router.post('/:id/shipment', protect, adminOnly, requireIdempotency(1440), createShipmentForOrder)
router.patch('/:id/status', protect, adminOnly, updateOrderStatusAdmin)
router.put('/:id/status', protect, adminOnly, updateOrderStatusAdmin) // compat
router.post('/:id/cod-remittance', protect, adminOnly, confirmCodRemittance)
router.post('/:id/restock', protect, adminOnly, restockRtoOrder)

export default router
