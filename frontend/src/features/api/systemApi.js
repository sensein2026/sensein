import { api } from '@/app/api'

export const systemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query({
      query: () => '/health',
      providesTags: ['System'],
    }),
  }),
})

export const { useGetHealthQuery } = systemApi
