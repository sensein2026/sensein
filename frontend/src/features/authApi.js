import { api } from '@/app/api'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    quickEmailLogin: builder.mutation({
      query: (data) => ({
        url: '/auth/quick-email-login',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    resendOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    verifyResetOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-reset-otp',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getSavedAddresses: builder.query({
      query: () => '/auth/addresses',
      providesTags: ['Address'],
    }),
    addSavedAddress: builder.mutation({
      query: (addressData) => ({
        url: '/auth/addresses',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['Address', 'User'],
    }),
    updateSavedAddress: builder.mutation({
      query: ({ addressId, ...addressData }) => ({
        url: `/auth/addresses/${addressId}`,
        method: 'PUT',
        body: addressData,
      }),
      invalidatesTags: ['Address', 'User'],
    }),
    deleteSavedAddress: builder.mutation({
      query: (addressId) => ({
        url: `/auth/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address', 'User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useQuickEmailLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetSavedAddressesQuery,
  useAddSavedAddressMutation,
  useUpdateSavedAddressMutation,
  useDeleteSavedAddressMutation,
} = authApi
