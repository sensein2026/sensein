import { Router } from 'express'
import { protect, adminOnly, superadminOnly } from '../middleware/auth.js'
import { upload } from '../utils/multerStorage.js'
import Refund from '../models/Refund.js'
import {
  getDashboardStats,
  getAllOrders,
  syncDelhiveryOrders,
  syncEkartOrders,
  getDelhiveryConfig,
  getEkartConfig,
  updateDelhiveryConfig,
  updateEkartConfig,
  getServiceAlert,
  updateServiceAlert,
  updateOrderStatus,
  createOrderShipment,
  confirmCodCollection,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  updateUserRole,
  createCategory,
  updateCategory,
  deleteCategory,
  exportOrdersCsv,
} from '../controllers/admin.controller.js'
import {
  getHomepageConfig,
  updateHomepageConfig,
  resetHomepageConfig,
  exportHomepageChangesCsv,
} from '../controllers/homepage.controller.js'
import {
  uploadMedia,
  getAllMedia,
  softDeleteMedia,
  restoreMedia,
  exportMediaCsv,
  triggerDailyReportEmail,
} from '../controllers/media.controller.js'
import {
  getAuditLogs,
  recoverFromAuditLog,
  exportAuditCsv,
} from '../controllers/audit.controller.js'
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
  getAdminInvoiceConfig,
  updateAdminInvoiceConfig,
} from '../controllers/siteSettings.controller.js'
import { sendSuccess, sendPaginated } from '../utils/responseEnvelope.js'

const router = Router()

// All admin routes require protect + adminOnly
router.use(protect, adminOnly)

// Dashboard Stats & Settings
router.get('/stats', getDashboardStats)
router.get('/settings', getAdminSiteSettings)
router.put('/settings', superadminOnly, updateAdminSiteSettings)

// Tax Invoice & Seller Configuration
router.get('/invoice-config', getAdminInvoiceConfig)
router.put('/invoice-config', updateAdminInvoiceConfig)

// Orders Management & Export
router.get('/orders/export', exportOrdersCsv)
router.post('/orders/sync-delhivery', syncDelhiveryOrders)
router.get('/orders/sync-delhivery', syncDelhiveryOrders)
router.post('/orders/sync-ekart', syncEkartOrders)
router.get('/orders/sync-ekart', syncEkartOrders)
router.get('/delhivery/config', getDelhiveryConfig)
router.put('/delhivery/config', updateDelhiveryConfig)
router.get('/ekart/config', getEkartConfig)
router.put('/ekart/config', updateEkartConfig)
router.get('/service-alert', getServiceAlert)
router.put('/service-alert', updateServiceAlert)
router.get('/maintenance', getAdminSiteSettings)
router.put('/maintenance', updateAdminSiteSettings)
router.get('/orders', getAllOrders)
router.put('/orders/:id/status', updateOrderStatus)
router.patch('/orders/:id/status', updateOrderStatus)
router.post('/orders/:id/shipment', createOrderShipment)
router.post('/orders/:id/collect-cod', confirmCodCollection)

// Payments & Refunds Ledger
router.get('/refunds', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const query = {}
    if (search) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [{ orderNumber: regex }, { razorpayRefundId: regex }, { razorpayPaymentId: regex }]
    }
    const skip = (Number(page) - 1) * Number(limit)
    const [refunds, total] = await Promise.all([
      Refund.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Refund.countDocuments(query),
    ])
    return sendPaginated(res, 'Refunds retrieved successfully', refunds, page, limit, total)
  } catch (err) {
    next(err)
  }
})

// Products Management
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)

// Users Management
router.get('/users', getAllUsers)
router.put('/users/:id/role', superadminOnly, updateUserRole)

// Category Management
router.post('/categories', createCategory)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

// Homepage CMS Management
router.get('/homepage', getHomepageConfig)
router.get('/homepage/export-changes', exportHomepageChangesCsv)
router.put('/homepage', updateHomepageConfig)
router.post('/homepage/reset', resetHomepageConfig)

// Media Asset Master Sheet & Upload Vault
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error processing uploaded file',
      })
    }
    next()
  })
}

router.post('/media/upload', handleUploadMiddleware, uploadMedia)
router.get('/media/export', exportMediaCsv)
router.post('/media/send-daily-report', triggerDailyReportEmail)
router.get('/media', getAllMedia)
router.delete('/media/:id', softDeleteMedia)
router.post('/media/:id/restore', restoreMedia)

// Activity Logs & Snapshot Recovery Vault
router.get('/audit-logs', getAuditLogs)
router.get('/audit/logs', getAuditLogs)
router.get('/audit/export', exportAuditCsv)
router.post('/audit/logs/:id/recover', recoverFromAuditLog)

export default router
