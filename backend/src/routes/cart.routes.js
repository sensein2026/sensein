import { Router } from 'express'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller.js'

const router = Router()

router.get('/', getCart)
router.post('/', addToCart)
router.put('/items/:itemId', updateCartItem)
router.delete('/items/:itemId', removeFromCart)
router.delete('/', clearCart)

export default router
