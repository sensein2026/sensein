import { Router } from 'express'
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  quickEmailLogin,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
  updateProfile,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/quick-email-login', quickEmailLogin)
router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendOtp)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-otp', verifyResetOtp)
router.post('/reset-password', resetPassword)
router.get('/me', getMe)
router.put('/profile', protect, updateProfile)

router.get('/addresses', protect, getSavedAddresses)
router.post('/addresses', protect, addSavedAddress)
router.put('/addresses/:addressId', protect, updateSavedAddress)
router.delete('/addresses/:addressId', protect, deleteSavedAddress)

export default router
