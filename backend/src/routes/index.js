import { Router } from 'express'
import healthRoutes from './health.routes.js'
import productRoutes from './product.routes.js'
import categoryRoutes from './category.routes.js'
import cartRoutes from './cart.routes.js'
import orderRoutes from './order.routes.js'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'
import homepageRoutes from './homepage.routes.js'
import bulkOrderRoutes from './bulkOrder.routes.js'
import paymentRoutes from './payment.routes.js'
import shippingRoutes from './shipping.routes.js'
import webhookRoutes from './webhook.routes.js'
import analyticsRoutes from './analytics.routes.js'
import siteSettingsRoutes from './siteSettings.routes.js'
import couponRoutes from './coupon.routes.js'
import returnRoutes from './return.routes.js'
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/returns', returnRoutes)
router.use('/coupons', couponRoutes)
router.use('/payment', paymentRoutes)
router.post('/create-order', optionalAuth, createPaymentOrder)
router.post('/verify-payment', optionalAuth, verifyPayment)
router.use('/shipping', shippingRoutes)
router.use('/webhooks', webhookRoutes)
router.use('/admin', adminRoutes)
router.use('/homepage', homepageRoutes)
router.use('/bulk-orders', bulkOrderRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/site-settings', siteSettingsRoutes)

export default router
