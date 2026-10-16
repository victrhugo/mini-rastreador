import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateOrderInput, Order, OrderStatus } from '../types'
import { api } from './client'

/**
 * Reserva caso a conexão em tempo real (SSE) caia: a tela ainda se atualiza sozinha.
 * Com o stream ativo, as mudanças chegam na hora (veja useOrderEvents).
 */
const FALLBACK_REFRESH_MS = 30_000

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: number) => ['orders', id] as const,
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: () => api<Order[]>('/api/orders'),
    refetchInterval: FALLBACK_REFRESH_MS,
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api<Order>(`/api/orders/${id}`),
    refetchInterval: FALLBACK_REFRESH_MS,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api<Order>('/api/orders', { method: 'POST', body: input }),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
      queryClient.invalidateQueries({ queryKey: orderKeys.all, exact: true })
    },
  })
}

export function useUpdateOrderStatus(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ status, version }: { status: OrderStatus; version: number }) =>
      api<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: { status, version } }),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      queryClient.invalidateQueries({ queryKey: orderKeys.all, exact: true })
    },
    // Em 409 o pedido mudou em outro lugar: recarrega lista e detalhe para mostrar o estado real.
    onError: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}
