import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token || getState().auth?.accessToken
    const user = getState().auth?.user
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (user?.email) headers.set('x-user-email', user.email)
    return headers
  },
})

// Wraps the base query so a 401 triggers one silent refresh-token attempt
// before failing. The auth feature will register the refresh endpoint;
// this stays generic so every feature API can share it.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    const token = api.getState().auth?.token
    const url = typeof args === 'string' ? args : args?.url || ''

    // Do not trigger logout on public/auth endpoints or when unauthenticated
    if (!token || url.includes('/auth/login') || url.includes('/auth/verify-otp') || url.includes('/auth/refresh')) {
      return result
    }

    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    )

    if (refreshResult.data) {
      api.dispatch({ type: 'auth/setCredentials', payload: refreshResult.data })
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Product',
    'Category',
    'Brand',
    'Cart',
    'Wishlist',
    'Review',
    'Coupon',
    'Address',
    'Order',
    'User',
    'System',
    'Homepage',
    'Stats',
    'Analytics',
    'BulkOrder',
    'Audit',
    'Logistics',
    'MaintenanceSettings',
  ],
  endpoints: () => ({}),
})
