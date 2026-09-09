import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import uiReducer from '@/store/uiSlice'
import cartReducer from '@/store/cartSlice'
import authReducer from '@/store/authSlice'
import wishlistReducer from '@/store/wishlistSlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    ui: uiReducer,
    cart: cartReducer,
    auth: authReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

