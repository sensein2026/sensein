import { api } from '@/app/api'

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    loginAdmin: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Stats', 'Order', 'Product', 'User'],
    }),
    // Products
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Stats'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product', 'Stats'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'Stats'],
    }),
    // Categories
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    // Orders
    getAdminOrders: builder.query({
      query: () => '/admin/orders',
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    updateOrderAddress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/address`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    // Users
    getAdminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['User'],
    }),
    // Homepage CMS
    getHomepageContent: builder.query({
      query: () => '/homepage',
      providesTags: ['Homepage'],
    }),
    updateHomepageContent: builder.mutation({
      query: (body) => ({
        url: '/admin/homepage',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Homepage', 'AuditLog'],
    }),
    resetHomepageContent: builder.mutation({
      query: () => ({
        url: '/admin/homepage/reset',
        method: 'POST',
      }),
      invalidatesTags: ['Homepage', 'AuditLog'],
    }),
    // Media File Upload Handler (Used by Pickers for Products & CMS)
    uploadMedia: builder.mutation({
      query: (formData) => ({
        url: '/admin/media/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['AuditLog'],
    }),
    // Activity Logs & Snapshot Recovery
    getAuditLogs: builder.query({
      query: (params) => ({
        url: '/admin/audit/logs',
        params,
      }),
      providesTags: ['AuditLog'],
    }),
    recoverFromLog: builder.mutation({
      query: (id) => ({
        url: `/admin/audit/logs/${id}/recover`,
        method: 'POST',
      }),
      invalidatesTags: ['AuditLog', 'Media', 'Homepage', 'Product'],
    }),
    // Bulk Order Inquiries & Config
    getBulkConfig: builder.query({
      query: () => '/bulk-orders/config',
      providesTags: ['BulkConfig'],
    }),
    updateBulkConfig: builder.mutation({
      query: (body) => ({
        url: '/bulk-orders/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['BulkConfig'],
    }),
    getBulkInquiries: builder.query({
      query: () => '/bulk-orders',
      providesTags: ['BulkInquiry'],
    }),
    updateBulkInquiryStatus: builder.mutation({
      query: ({ id, status, remarks }) => ({
        url: `/bulk-orders/${id}/status`,
        method: 'PUT',
        body: { status, remarks },
      }),
      invalidatesTags: ['BulkInquiry'],
    }),
    updateBulkInquiry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/bulk-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['BulkInquiry'],
    }),
    deleteBulkInquiry: builder.mutation({
      query: (id) => ({
        url: `/bulk-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BulkInquiry'],
    }),
    // Analytics & Funnel Tracking
    getAnalyticsSummary: builder.query({
      query: (params) => ({
        url: '/analytics/summary',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getTrackingConfig: builder.query({
      query: () => '/analytics/admin-config',
      providesTags: ['TrackingConfig'],
    }),
    updateTrackingConfig: builder.mutation({
      query: (body) => ({
        url: '/analytics/admin-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TrackingConfig', 'Analytics'],
    }),
    // Shipping & Ekart Logistics
    getEkartConfig: builder.query({
      query: () => '/admin/ekart/config',
      providesTags: ['ShippingConfig'],
    }),
    updateEkartConfig: builder.mutation({
      query: (body) => ({
        url: '/admin/ekart/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ShippingConfig'],
    }),
    createShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    bulkCreateShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/bulk-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    getEkartConfig: builder.query({
      query: () => '/shipping/ekart/config',
      providesTags: ['EkartConfig', 'DelhiveryConfig'],
    }),
    updateEkartConfig: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['EkartConfig', 'DelhiveryConfig', 'Order'],
    }),
    createEkartShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    bulkCreateEkartShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/bulk-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    getEkartTracking: builder.query({
      query: (awb) => `/shipping/ekart/track/${awb}`,
    }),
    estimateEkartRate: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/estimate',
        method: 'POST',
        body,
      }),
    }),
    getEkartAddresses: builder.query({
      query: () => '/shipping/ekart/addresses',
      providesTags: ['EkartConfig'],
    }),
    handleEkartNdr: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/ndr',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    syncDelhiveryOrders: builder.mutation({
      query: () => ({
        url: '/admin/orders/sync-delhivery',
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    syncEkartOrders: builder.mutation({
      query: () => ({
        url: '/admin/orders/sync-delhivery',
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    getDelhiveryConfig: builder.query({
      query: () => '/shipping/ekart/config',
      providesTags: ['DelhiveryConfig'],
    }),
    updateDelhiveryConfig: builder.mutation({
      query: (body) => ({
        url: '/shipping/ekart/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DelhiveryConfig', 'Order'],
    }),
    syncDelhiveryOrders: builder.mutation({
      query: () => ({
        url: '/shipping/ekart/bulk-create',
        method: 'POST',
        body: { orderIds: [] },
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    // Maintenance Mode & Site Settings
    getMaintenanceSettings: builder.query({
      query: () => '/admin/maintenance',
      providesTags: ['MaintenanceSettings'],
    }),
    updateMaintenanceSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/maintenance',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MaintenanceSettings', 'AuditLog'],
    }),
    // Service Alert
    getServiceAlert: builder.query({
      query: () => '/admin/service-alert',
      providesTags: ['ServiceAlert'],
    }),
    updateServiceAlert: builder.mutation({
      query: (body) => ({
        url: '/admin/service-alert',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ServiceAlert'],
    }),
    getInvoiceConfig: builder.query({
      query: () => '/admin/invoice-config',
      providesTags: ['InvoiceConfig'],
    }),
    updateInvoiceConfig: builder.mutation({
      query: (body) => ({
        url: '/admin/invoice-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['InvoiceConfig', 'AuditLog'],
    }),
    // Coupons Management
    getCoupons: builder.query({
      query: () => '/coupons/admin',
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation({
      query: (body) => ({
        url: '/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/coupons/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupon'],
    }),
    toggleCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Coupon'],
    }),
    // Store Shipping Fee & Free Delivery Settings
    getShippingFeeSettings: builder.query({
      query: () => '/shipping/settings',
      providesTags: ['ShippingConfig', 'ShippingSettings'],
    }),
    updateShippingFeeSettings: builder.mutation({
      query: (body) => ({
        url: '/shipping/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ShippingConfig', 'ShippingSettings', 'Order'],
    }),
  }),
})

export const {
  useLoginAdminMutation,
  useGetAdminStatsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderAddressMutation,
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useGetHomepageContentQuery,
  useUpdateHomepageContentMutation,
  useResetHomepageContentMutation,
  useUploadMediaMutation,
  useGetAuditLogsQuery,
  useRecoverFromLogMutation,
  useGetBulkConfigQuery,
  useUpdateBulkConfigMutation,
  useGetBulkInquiriesQuery,
  useUpdateBulkInquiryStatusMutation,
  useUpdateBulkInquiryMutation,
  useDeleteBulkInquiryMutation,
  useGetAnalyticsSummaryQuery,
  useGetTrackingConfigQuery,
  useUpdateTrackingConfigMutation,
  useGetDelhiveryConfigQuery,
  useUpdateDelhiveryConfigMutation,
  useGetEkartConfigQuery,
  useUpdateEkartConfigMutation,
  useCreateEkartShippingMutation,
  useBulkCreateEkartShippingMutation,
  useGetEkartTrackingQuery,
  useEstimateEkartRateMutation,
  useGetEkartAddressesQuery,
  useHandleEkartNdrMutation,
  useCreateShippingMutation,
  useBulkCreateShippingMutation,
  useSyncDelhiveryOrdersMutation,
  useSyncEkartOrdersMutation,
  useGetServiceAlertQuery,
  useUpdateServiceAlertMutation,
  useGetMaintenanceSettingsQuery,
  useUpdateMaintenanceSettingsMutation,
  useGetInvoiceConfigQuery,
  useUpdateInvoiceConfigMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useToggleCouponMutation,
  useGetShippingFeeSettingsQuery,
  useUpdateShippingFeeSettingsMutation,
} = adminApi
