import { createSlice } from '@reduxjs/toolkit'

const loadWishlistFromStorage = () => {
  try {
    const saved = localStorage.getItem('sensein_wishlist')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveWishlistToStorage = (items) => {
  try {
    localStorage.setItem('sensein_wishlist', JSON.stringify(items))
  } catch {
    // ignore
  }
}

const initialState = {
  items: loadWishlistFromStorage(),
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlistItem: (state, action) => {
      const product = action.payload
      const existingIndex = state.items.findIndex((item) => (item._id || item.id) === (product._id || product.id))

      if (existingIndex >= 0) {
        state.items.splice(existingIndex, 1)
      } else {
        state.items.push(product)
      }
      saveWishlistToStorage(state.items)
    },
    removeFromWishlist: (state, action) => {
      const productId = action.payload
      state.items = state.items.filter((item) => (item._id || item.id) !== productId)
      saveWishlistToStorage(state.items)
    },
    clearWishlist: (state) => {
      state.items = []
      saveWishlistToStorage([])
    },
    syncWishlistWithActiveProducts: (state, action) => {
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
        if (!item) return false
        const pId = String(item._id || item.id || '')
        const pSlug = String(item.slug || '').toLowerCase()
        return (pId && activeIds.has(pId)) || (pSlug && activeSlugs.has(pSlug))
      })

      if (state.items.length !== initialCount) {
        saveWishlistToStorage(state.items)
      }
    },
  },
})

export const {
  toggleWishlistItem,
  removeFromWishlist,
  clearWishlist,
  syncWishlistWithActiveProducts,
} = wishlistSlice.actions

export const selectWishlistItems = (state) => state.wishlist.items
export const selectWishlistCount = (state) => state.wishlist.items.length
export const selectIsInWishlist = (id) => (state) =>
  state.wishlist.items.some((item) => (item._id || item.id) === id)

export default wishlistSlice.reducer
