import { Router } from 'express'
import { checkPincodeServiceability, trackShipment } from '../services/delhiveryService.js'
import { handleDelhiveryWebhook } from '../controllers/shipping.controller.js'
import { sendSuccess, sendError } from '../utils/responseEnvelope.js'

const router = Router()

router.get('/serviceability/:pincode', async (req, res, next) => {
  try {
    const result = await checkPincodeServiceability(req.params.pincode)
    return res.json(result)
  } catch (error) {
    return sendError(res, error.message, 400, 'SERVICEABILITY_ERROR')
  }
})

router.get('/track/:waybill', async (req, res, next) => {
  try {
    const result = await trackShipment(req.params.waybill)
    return res.json(result)
  } catch (error) {
    return sendError(res, error.message, 400, 'TRACKING_ERROR')
  }
})

router.post('/webhook', handleDelhiveryWebhook)

export default router
