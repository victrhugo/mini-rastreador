import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateOrderInput, Order, OrderStatus } from '../types'
import { api } from './client'

/** Intervalo de atualização automática: dá a sensação de rastreamento ao vivo. */
const LIVE_REFRESH_MS = 5_000

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: number) => ['orders', id] as const,
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: () => api<Order[]>('/api/orders'),
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api<Order>(`/api/orders/${id}`),
    refetchInterval: LIVE_REFRESH_MS,
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
    mutationFn: (status: OrderStatus) =>
      api<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      queryClient.invalidateQueries({ queryKey: orderKeys.all, exact: true })
    },
    // Em 409 o pedido mudou em outro lugar: recarrega para mostrar o estado real.
    onError: () => queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) }),
  })
}
