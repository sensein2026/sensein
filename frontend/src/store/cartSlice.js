import { createSlice } from '@reduxjs/toolkit'

const getProductId = (product) => {
  if (!product) return null
  return String(product._id || product.id || product.slug || '')
}

const getCartItemId = (item) => {
  if (!item) return null
  return String(item.product?._id || item.product?.id || item.product?.slug || item._id || item.id || '')
}

const isSameCartItem = (cartItem, targetProduct) => {
  const cId = getCartItemId(cartItem)
  const tId = getProductId(targetProduct)
  if (!cId || !tId || cId !== tId) return false

  const cSize = cartItem.product?.selectedSize || cartItem.selectedSize || ''
  const tSize = targetProduct?.selectedSize || ''
  if (cSize || tSize) {
    return cSize === tSize
  }
  return true
}

const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem('sensein_cart')
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) => item && item.product && getProductId(item.product)
    )
  } catch (e) {
    return []
  }
}

const saveCartToStorage = (items) => {
  try {
    localStorage.setItem('sensein_cart', JSON.stringify(items))
  } catch (e) {
    // ignore localStorage errors
  }
}

const loadCouponFromStorage = () => {
  try {
    const saved = localStorage.getItem('sensein_applied_coupon')
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    return null
  }
}

const saveCouponToStorage = (coupon) => {
  try {
    if (coupon) {
      localStorage.setItem('sensein_applied_coupon', JSON.stringify(coupon))
    } else {
      localStorage.removeItem('sensein_applied_coupon')
    }
  } catch (e) {
    // ignore
  }
}

const initialState = {
  items: loadCartFromStorage(),
  appliedCoupon: loadCouponFromStorage(),
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload
      const targetId = getProductId(product)
      if (!targetId) return

      const existingIndex = state.items.findIndex((item) =>
        isSameCartItem(item, product)
      )

      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += Number(quantity) || 1
      } else {
        state.items.push({
          product,
          quantity: Number(quantity) || 1,
          price: product.price,
        })
      }
      saveCartToStorage(state.items)
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload
      const pId = String(productId || '')
      if (!pId) return

      const existingIndex = state.items.findIndex(
        (item) => getCartItemId(item) === pId
      )

      if (existingIndex !== -1) {
        if (quantity <= 0) {
          state.items.splice(existingIndex, 1)
          // Always remove coupon when item is removed
          state.appliedCoupon = null
          saveCouponToStorage(null)
        } else {
          state.items[existingIndex].quantity = Number(quantity)
          // If total drops below coupon min spend, automatically remove coupon
          if (state.appliedCoupon?.minSpend) {
            const currentSubtotal = state.items.reduce(
              (sum, it) => sum + (it.product?.price || it.price || 0) * (it.quantity || 1),
              0
            )
            if (currentSubtotal < state.appliedCoupon.minSpend) {
              state.appliedCoupon = null
              saveCouponToStorage(null)
            }
          }
        }
      }
      saveCartToStorage(state.items)
    },
    removeFromCart: (state, action) => {
      const productId = String(action.payload || '')
      if (!productId) return
      state.items = state.items.filter((item) => getCartItemId(item) !== productId)
      // Automatically remove applied coupon when an item is removed from cart
      state.appliedCoupon = null
      saveCouponToStorage(null)
      saveCartToStorage(state.items)
    },
    clearCart: (state) => {
      state.items = []
      state.appliedCoupon = null
      saveCartToStorage([])
      saveCouponToStorage(null)
    },
    setCartItems: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : []
      saveCartToStorage(state.items)
    },
    syncCartWithActiveProducts: (state, action) => {
      const activeProducts = action.payload
      if (!Array.isArray(activeProducts)) return

      const activeIds = new Set(
        activeProducts.map((p) => String(p._id || p.id || ''))
      )
      const activeSlugs = new Set(
        activeProducts.map((p) => String(p.slug || '').toLowerCase())
      )

      const initialCount = state.items.length
      state.items = state.items.filter((item) => {
        if (!item || !item.product) return false
        const pId = String(item.product._id || item.product.id || '')
        const pSlug = String(item.product.slug || '').toLowerCase()
        return (pId && activeIds.has(pId)) || (pSlug && activeSlugs.has(pSlug))
      })

      if (state.items.length !== initialCount) {
        saveCartToStorage(state.items)
      }
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload
      saveCouponToStorage(action.payload)
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null
      saveCouponToStorage(null)
    },
  },
})

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  setCartItems,
  syncCartWithActiveProducts,
  applyCoupon,
  removeCoupon,
} = cartSlice.actions

export const selectCartItems = (state) => state.cart.items
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 1), 0)
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce(
    (total, item) => total + (item.product?.price || item.price || 0) * (item.quantity || 1),
    0
  )

export default cartSlice.reducer
