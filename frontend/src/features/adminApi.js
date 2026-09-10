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
    // Delhivery Dedicated B2C Logistics Endpoints
    getDelhiveryConfig: builder.query({
      query: () => '/shipping/delhivery/config',
      providesTags: ['DelhiveryConfig', 'ShippingConfig'],
    }),
    updateDelhiveryConfig: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DelhiveryConfig', 'ShippingConfig', 'Order', 'Stats'],
    }),
    createDelhiveryShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    bulkCreateDelhiveryShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/bulk-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    getDelhiveryTracking: builder.query({
      query: (waybill) => `/shipping/delhivery/track/${waybill}`,
    }),
    checkDelhiveryPincode: builder.query({
      query: (pincode) => `/shipping/delhivery/pincode/${pincode}`,
    }),
    estimateDelhiveryRate: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/estimate',
        method: 'POST',
        body,
      }),
    }),
    cancelDelhiveryShipment: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/cancel',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    // Generic Aliases for compatibility
    createShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    bulkCreateShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/bulk-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    // Ekart aliases redirecting to Delhivery
    getEkartConfig: builder.query({
      query: () => '/shipping/delhivery/config',
      providesTags: ['DelhiveryConfig', 'ShippingConfig'],
    }),
    updateEkartConfig: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DelhiveryConfig', 'ShippingConfig', 'Order'],
    }),
    createEkartShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    bulkCreateEkartShipping: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/bulk-create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Stats'],
    }),
    getEkartTracking: builder.query({
      query: (awb) => `/shipping/delhivery/track/${awb}`,
    }),
    estimateEkartRate: builder.mutation({
      query: (body) => ({
        url: '/shipping/delhivery/estimate',
        method: 'POST',
        body,
      }),
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
    // Invoice / Seller Configuration
    getInvoiceConfig: builder.query({
      query: () => '/admin/invoice-config',
      providesTags: ['InvoiceConfig', 'SiteSettings'],
    }),
    updateInvoiceConfig: builder.mutation({
      query: (body) => ({
        url: '/admin/invoice-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['InvoiceConfig', 'SiteSettings', 'AuditLog'],
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
  useCreateDelhiveryShippingMutation,
  useBulkCreateDelhiveryShippingMutation,
  useGetDelhiveryTrackingQuery,
  useCheckDelhiveryPincodeQuery,
  useEstimateDelhiveryRateMutation,
  useCancelDelhiveryShipmentMutation,
  useGetEkartConfigQuery,
  useUpdateEkartConfigMutation,
  useCreateEkartShippingMutation,
  useBulkCreateEkartShippingMutation,
  useGetEkartTrackingQuery,
  useEstimateEkartRateMutation,
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
  useGetShippingFeeSettingsQuery,
  useUpdateShippingFeeSettingsMutation,
} = adminApi
