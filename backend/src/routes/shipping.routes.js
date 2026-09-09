import { Router } from 'express'
import {
  createDelhiveryShipping,
  bulkCreateDelhiveryShipping,
  getDelhiveryTracking,
  checkDelhiveryPincodeHandler,
  estimateDelhiveryRateHandler,
  getDelhiveryConfigHandler,
  updateDelhiveryConfigHandler,
  cancelDelhiveryOrderShipment,
  getShippingRates,
  getCouriersList,
  processReturnRequest,
  handleNdrReattempt,
  handleDelhiveryWebhook,
  createShipping,
  bulkCreateShipping,
  getShippingTracking,
  checkPincode,
  cancelOrderShipment,
  getShippingSettings,
  updateShippingSettings,
} from '../controllers/shipping.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// Store Shipping Rates & Delivery Policy Settings
router.get('/settings', getShippingSettings)
router.put('/settings', protect, updateShippingSettings)

// Pincode Serviceability & Rate Check (Public / Storefront)
router.get('/check-pincode/:pincode', checkPincode)
router.get('/check-pincode', checkPincode)
router.get('/serviceability', checkPincode)
router.get('/rates', getShippingRates)
router.get('/couriers', getCouriersList)

// Tracking & Webhooks
router.get('/track/:awb', getShippingTracking)
router.get('/track', getShippingTracking)
router.post('/webhook', handleDelhiveryWebhook)

// Delhivery B2C Dedicated Endpoints (Admin & Storefront)
router.get('/delhivery/config', getDelhiveryConfigHandler)
router.put('/delhivery/config', protect, updateDelhiveryConfigHandler)
router.post('/delhivery/create', protect, createDelhiveryShipping)
router.post('/delhivery/bulk-create', protect, bulkCreateDelhiveryShipping)
router.get('/delhivery/track/:awb', getDelhiveryTracking)
router.get('/delhivery/track', getDelhiveryTracking)
router.get('/delhivery/pincode/:pincode', checkDelhiveryPincodeHandler)
router.get('/delhivery/pincode', checkDelhiveryPincodeHandler)
router.get('/delhivery/check-pincode/:pincode', checkDelhiveryPincodeHandler)
router.get('/delhivery/check-pincode', checkDelhiveryPincodeHandler)
router.post('/delhivery/estimate', estimateDelhiveryRateHandler)
router.post('/delhivery/cancel', protect, cancelDelhiveryOrderShipment)

// Standard Unified Aliases (Protected)
router.post('/create', protect, createShipping)
router.post('/bulk-create', protect, bulkCreateShipping)
router.post('/cancel', protect, cancelOrderShipment)
router.post('/return', protect, processReturnRequest)
router.post('/ndr-reattempt', protect, handleNdrReattempt)

export default router
