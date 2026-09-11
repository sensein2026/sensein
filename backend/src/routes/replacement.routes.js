import { Router } from 'express'
import {
  createReplacementRequest,
  getReplacements,
  getReplacementById,
  approveReplacement,
  rejectReplacement,
  recordReplacementQC,
  createReplacementDispatchShipment,
  convertToRefundException,
  cancelReplacementRequest,
  getReplacementTracking,
} from '../controllers/replacement.controller.js'
import { protect, adminOnly, superadminOnly, optionalAuth } from '../middleware/auth.js'
import { requireIdempotency } from '../middleware/idempotencyKey.js'

const router = Router()

// Customer Replacement Request & List
router.post('/', protect, createReplacementRequest)
router.get('/', optionalAuth, getReplacements)
router.get('/:id/track', getReplacementTracking)
router.get('/:id', optionalAuth, getReplacementById)

// Customer / Admin Cancel Replacement
router.patch('/:id/cancel', protect, cancelReplacementRequest)

// Admin Actions
router.patch('/:id/approve', protect, adminOnly, requireIdempotency(1440), approveReplacement)
router.patch('/:id/reject', protect, adminOnly, rejectReplacement)
router.patch('/:id/qc', protect, adminOnly, recordReplacementQC)
router.post('/:id/reverse-pickup', protect, adminOnly, requireIdempotency(1440), approveReplacement)
router.post('/:id/shipment', protect, adminOnly, requireIdempotency(1440), createReplacementDispatchShipment)

// Refund Conversion (Admin / Superadmin)
router.patch('/:id/convert-to-refund', protect, adminOnly, convertToRefundException)

export default router
