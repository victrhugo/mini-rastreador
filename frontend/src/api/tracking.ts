import { useQuery } from '@tanstack/react-query'
import type { PublicTracking } from '../types'
import { api, ApiError } from './client'

export const trackingKey = (code: string) => ['tracking', code] as const

/** Dados públicos do pedido para a página de rastreio do cliente. */
export function usePublicTracking(code: string) {
  return useQuery({
    queryKey: trackingKey(code),
    queryFn: () => api<PublicTracking>(`/api/public/tracking/${encodeURIComponent(code)}`),
    refetchInterval: 30_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
}

export function trackingUrl(code: string) {
  return `${window.location.origin}/rastreio/${code}`
}
