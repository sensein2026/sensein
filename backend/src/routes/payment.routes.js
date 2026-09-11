import { Router } from 'express'
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  handleRefund,
  markPaymentFailed,
} from '../controllers/payment.controller.js'
import { protect, superadminOnly, adminOnly, optionalAuth } from '../middleware/auth.js'
import { requireIdempotency } from '../middleware/idempotencyKey.js'
import { paymentLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// Payment Order Creation
router.post('/create-order', paymentLimiter, requireIdempotency(1440), optionalAuth, createPaymentOrder)
router.post('/create', paymentLimiter, requireIdempotency(1440), optionalAuth, createPaymentOrder)

// Fast-path Payment Signature Verification
router.post('/verify', paymentLimiter, optionalAuth, verifyPayment)
router.post('/failed', optionalAuth, markPaymentFailed)

// Webhook - Handled raw without standard parser (also registered in webhook.routes.js)
router.post('/webhook', handleRazorpayWebhook)

// Admin / Superadmin Refund
router.post('/refund', protect, adminOnly, requireIdempotency(1440), handleRefund)

export default router
