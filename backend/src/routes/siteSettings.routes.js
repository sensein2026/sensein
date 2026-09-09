import { Router } from 'express'
import { getPublicMaintenanceStatus, getPublicInvoiceConfig } from '../controllers/siteSettings.controller.js'

const router = Router()

// Public endpoint for checking maintenance status
router.get('/maintenance-status', getPublicMaintenanceStatus)

// Public endpoint for fetching tax invoice seller details
router.get('/invoice-config', getPublicInvoiceConfig)

export default router
