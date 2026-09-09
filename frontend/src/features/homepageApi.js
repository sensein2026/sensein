import { useEffect, useState } from 'react'
import { api } from '@/app/api'

const HOMEPAGE_STORAGE_KEY = 'sensein_cached_homepage_config'

export const homepageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHomepageConfig: builder.query({
      query: () => '/homepage',
      providesTags: ['Homepage'],
    }),
  }),
})

export const { useGetHomepageConfigQuery } = homepageApi

export function useHomepageConfig() {
  const { data: response, isLoading, isFetching } = useGetHomepageConfigQuery()

  // Load from localStorage cache immediately to prevent flash/flicker on refresh
  const [cachedData, setCachedData] = useState(() => {
    try {
      const item = localStorage.getItem(HOMEPAGE_STORAGE_KEY)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (response?.data) {
      try {
        localStorage.setItem(HOMEPAGE_STORAGE_KEY, JSON.stringify(response.data))
      } catch (e) {
        console.error('Failed to update homepage cache:', e)
      }
      setCachedData(response.data)
    }
  }, [response?.data])

  const config = response?.data || cachedData

  return {
    config,
    isLoading: isLoading && !cachedData,
    isFetching,
    response,
  }
}
