import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

const getOrCreateCart = async (req) => {
  const sessionId = req.headers['x-session-id'] || 'guest_session'
  let cart = await Cart.findOne({ sessionId }).populate('items.product')
  if (!cart) {
    cart = new Cart({ sessionId, items: [] })
    await cart.save()
  }
  return cart
}

export const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req)
    res.json({ success: true, data: cart })
  } catch (error) {
    next(error)
  }
}

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const cart = await getOrCreateCart(req)
    const existingIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId || item.product.toString() === productId
    )

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity)
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        price: product.price,
      })
    }

    await cart.save()
    await cart.populate('items.product')
    res.json({ success: true, data: cart })
  } catch (error) {
    next(error)
  }
}

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params
    const { quantity } = req.body

    const cart = await getOrCreateCart(req)
    const item = cart.items.id(itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' })
    }

    if (quantity <= 0) {
      cart.items.pull(itemId)
    } else {
      item.quantity = Number(quantity)
    }

    await cart.save()
    await cart.populate('items.product')
    res.json({ success: true, data: cart })
  } catch (error) {
    next(error)
  }
}

export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params
    const cart = await getOrCreateCart(req)
    cart.items.pull(itemId)
    await cart.save()
    await cart.populate('items.product')
    res.json({ success: true, data: cart })
  } catch (error) {
    next(error)
  }
}

export const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req)
    cart.items = []
    await cart.save()
    res.json({ success: true, data: cart })
  } catch (error) {
    next(error)
  }
}
