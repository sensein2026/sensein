import { Router } from 'express'
import {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  processRefund,
} from '../controllers/payment.controller.js'
import { optionalAuth, protect } from '../middleware/auth.js'

const router = Router()

router.post('/create', optionalAuth, createPaymentOrder)
router.post('/create-order', optionalAuth, createPaymentOrder)
router.post('/verify', optionalAuth, verifyPayment)
router.post('/verify-payment', optionalAuth, verifyPayment)
router.post('/failed', optionalAuth, paymentFailed)
router.post('/refund', protect, processRefund)

export default router
