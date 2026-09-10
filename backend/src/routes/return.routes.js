import { Router } from 'express'
import {
  createReturnRequest,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  processReturnQC,
} from '../controllers/return.controller.js'
import { protect, admin, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', optionalAuth, createReturnRequest)
router.get('/', protect, getAllReturns)
router.get('/:id', protect, getReturnById)
router.put('/:id/status', protect, admin, updateReturnStatus)
router.post('/:id/qc', protect, admin, processReturnQC)

export default router
