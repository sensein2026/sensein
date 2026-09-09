import { Router } from 'express'
import {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
} from '../controllers/payment.controller.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/create', optionalAuth, createPaymentOrder)
router.post('/create-order', optionalAuth, createPaymentOrder)
router.post('/verify', optionalAuth, verifyPayment)
router.post('/verify-payment', optionalAuth, verifyPayment)
router.post('/failed', optionalAuth, paymentFailed)

export default router
