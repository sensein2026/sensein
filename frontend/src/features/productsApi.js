import { api } from '@/app/api'

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getFeaturedProducts: builder.query({
      query: () => '/products/featured',
      providesTags: ['Product'],
    }),
    getProductBySlug: builder.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
    }),
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetProductBySlugQuery,
  useGetCategoriesQuery,
} = productsApi
