import { Router } from 'express'
import {
  getBulkOrderConfig,
  updateBulkOrderConfig,
  createBulkInquiry,
  getAllBulkInquiries,
  updateBulkInquiryStatus,
  updateBulkInquiry,
  deleteBulkInquiry,
  exportBulkInquiriesCsv,
} from '../controllers/bulkOrder.controller.js'
import { protect, admin } from '../middleware/auth.js'

const router = Router()

// Public route to get configured quantity options
router.get('/config', getBulkOrderConfig)

// Admin route to manage quantity options
router.put('/config', protect, admin, updateBulkOrderConfig)

// Bulk inquiries
router.post('/', createBulkInquiry)
router.get('/', protect, admin, getAllBulkInquiries)
router.get('/export/csv', protect, admin, exportBulkInquiriesCsv)
router.put('/:id/status', protect, admin, updateBulkInquiryStatus)
router.put('/:id', protect, admin, updateBulkInquiry)
router.delete('/:id', protect, admin, deleteBulkInquiry)

export default router
