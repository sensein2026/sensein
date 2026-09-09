import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token || localStorage.getItem('admin_token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Stats', 'Product', 'Category', 'Order', 'User', 'Homepage', 'Media', 'AuditLog', 'MaintenanceSettings', 'Coupon'],
  endpoints: () => ({}),
})
