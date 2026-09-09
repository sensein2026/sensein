import { Router } from 'express'
import { protect, admin, optionalAuth } from '../middleware/auth.js'
import {
  getActiveCoupons,
  validateCoupon,
  getAllCouponsAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from '../controllers/coupon.controller.js'

const router = Router()

// Public route for storefront to fetch active vouchers (with optional user context)
router.get('/', optionalAuth, getActiveCoupons)
router.post('/validate', optionalAuth, validateCoupon)

// Admin routes (require auth & admin role)
router.get('/admin', protect, admin, getAllCouponsAdmin)
router.post('/', protect, admin, createCoupon)
router.put('/:id', protect, admin, updateCoupon)
router.delete('/:id', protect, admin, deleteCoupon)
router.patch('/:id/toggle', protect, admin, toggleCouponStatus)

export default router
