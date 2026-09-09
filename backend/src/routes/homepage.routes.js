import { Router } from 'express'
import { getHomepageConfig } from '../controllers/homepage.controller.js'

const router = Router()

// Public read access for client store
router.get('/', getHomepageConfig)

export default router
