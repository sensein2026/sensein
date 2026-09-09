import { Router } from 'express'
import { protect, admin } from '../middleware/auth.js'
import { upload } from '../utils/multerStorage.js'
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

const router = Router()

// All routes are protected by JWT and require admin role
router.use(protect, admin)

// Tax Invoice & Seller Configuration
router.get('/invoice-config', getAdminInvoiceConfig)
router.put('/invoice-config', updateAdminInvoiceConfig)

// Dashboard Stats
router.get('/stats', getDashboardStats)

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

// Products Management
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)

// Users Management
router.get('/users', getAllUsers)
router.put('/users/:id/role', updateUserRole)

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
router.get('/audit/logs', getAuditLogs)
router.get('/audit/export', exportAuditCsv)
router.post('/audit/logs/:id/recover', recoverFromAuditLog)

export default router
