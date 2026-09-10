import { Router } from 'express'
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTrackingById,
  trackOrder,
  checkPincode,
  createRazorpayOrder,
  verifyRazorpaySignature,
  refundRazorpayPayment,
  cancelUserOrder,
  updateOrderAddress,
} from '../controllers/order.controller.js'
import { createReturnRequest } from '../controllers/return.controller.js'
import { verifyPayment } from '../controllers/payment.controller.js'
import { updateOrderStatus } from '../controllers/admin.controller.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', optionalAuth, createOrder)
router.get('/pincode-check/:code', checkPincode)
router.post('/create-razorpay-order', optionalAuth, createRazorpayOrder)
router.post('/verify-razorpay-signature', optionalAuth, verifyRazorpaySignature)
router.post('/refund', protect, refundRazorpayPayment)
router.post('/return', protect, createReturnRequest)
router.post('/verify-payment', verifyPayment)
router.get('/my-orders', protect, getMyOrders)
router.get('/track', trackOrder)
router.get('/:id/tracking', getOrderTrackingById)

router.get('/:id', getOrderById)
router.put('/:id/status', updateOrderStatus)
router.put('/:id/address', optionalAuth, updateOrderAddress)
router.post('/:id/cancel', cancelUserOrder)

export default router
