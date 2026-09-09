import { configureStore } from '@reduxjs/toolkit'
import { api } from '@/app/api'
import authReducer from './authSlice'
import { toastMiddleware } from './toastMiddleware'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, toastMiddleware),
})
