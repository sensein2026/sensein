import { Router } from 'express'
import {
  trackEvent,
  getPublicTrackingConfig,
  getAdminTrackingConfig,
  updateAdminTrackingConfig,
  getAnalyticsSummary,
} from '../controllers/analytics.controller.js'
import { protect, admin } from '../middleware/auth.js'

const router = Router()

// Public Tracking Endpoints
router.post('/event', trackEvent)
router.get('/config', getPublicTrackingConfig)

// Admin Protected Analytics & Funnel Endpoints
router.get('/summary', protect, admin, getAnalyticsSummary)
router.get('/admin-config', protect, admin, getAdminTrackingConfig)
router.put('/admin-config', protect, admin, updateAdminTrackingConfig)

export default router
