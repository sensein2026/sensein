import { api } from '@/app/api'

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order', 'Cart', 'Address', 'User'],
    }),
    getMyOrders: builder.query({
      query: () => '/orders/my-orders',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getOrderTracking: builder.query({
      query: (id) => `/orders/${id}/tracking`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    trackOrders: builder.query({
      query: (query) => `/orders/track?query=${encodeURIComponent(query)}`,
      providesTags: ['Order'],
    }),
    checkPincode: builder.query({
      query: (code) => `/orders/pincode-check/${code}`,
    }),
    createPaymentOrder: builder.mutation({
      query: (data) => ({
        url: '/payment/create',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/payment/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order', 'Address', 'User'],
    }),
    markPaymentFailed: builder.mutation({
      query: (data) => ({
        url: '/payment/failed',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),
    createShipping: builder.mutation({
      query: (data) => ({
        url: '/shipping/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),
    createRazorpayOrder: builder.mutation({
      query: (data) => ({
        url: '/payment/create',
        method: 'POST',
        body: data,
      }),
    }),
    verifyRazorpaySignature: builder.mutation({
      query: (data) => ({
        url: '/payment/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, orderStatus, paymentStatus, courierPartner, trackingNumber, newCheckpoint }) => ({
        url: `/orders/${id}/status`,
        method: 'PUT',
        body: { orderStatus, paymentStatus, courierPartner, trackingNumber, newCheckpoint },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
    }),
    cancelUserOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order'],
    }),
    updateOrderAddress: builder.mutation({
      query: ({ id, ...addressData }) => ({
        url: `/orders/${id}/address`,
        method: 'PUT',
        body: addressData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order', 'Address', 'User'],
    }),
    getPublicInvoiceConfig: builder.query({
      query: () => '/site-settings/invoice-config',
      providesTags: ['InvoiceConfig'],
    }),
    getShippingSettings: builder.query({
      query: () => '/shipping/settings',
      providesTags: ['ShippingSettings'],
    }),
    createReturnRequest: builder.mutation({
      query: (returnData) => ({
        url: '/returns',
        method: 'POST',
        body: returnData,
      }),
      invalidatesTags: ['Order', 'Return'],
    }),
    getMyReturns: builder.query({
      query: () => '/returns',
      providesTags: ['Return'],
    }),
    getReturnById: builder.query({
      query: (id) => `/returns/${id}`,
      providesTags: (result, error, id) => [{ type: 'Return', id }],
    }),
  }),
})

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderTrackingQuery,
  useLazyGetOrderTrackingQuery,
  useTrackOrdersQuery,
  useLazyTrackOrdersQuery,
  useLazyCheckPincodeQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useMarkPaymentFailedMutation,
  useCreateShippingMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpaySignatureMutation,
  useUpdateOrderStatusMutation,
  useCancelUserOrderMutation,
  useUpdateOrderAddressMutation,
  useGetPublicInvoiceConfigQuery,
  useGetShippingSettingsQuery,
  useCreateReturnRequestMutation,
  useGetMyReturnsQuery,
  useGetReturnByIdQuery,
} = ordersApi
