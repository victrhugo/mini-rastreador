export const ORDER_STATUSES = [
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface OrderItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface StatusChange {
  from: OrderStatus | null
  to: OrderStatus
  changedBy: string
  changedAt: string
}

export interface Address {
  street: string
  number: string
  complement: string | null
  district: string
  city: string
  zipCode: string
}

export interface Order {
  id: number
  status: OrderStatus
  allowedTransitions: OrderStatus[]
  total: number
  customer: { name: string; phone: string | null }
  address: Address
  items: OrderItem[]
  history: StatusChange[]
  createdBy: string
  createdAt: string
  updatedAt: string
  /** Versão do pedido; enviada ao mudar o status para detectar alterações concorrentes. */
  version: number
}

export interface CreateOrderInput {
  customer: { name: string; phone?: string }
  address: Omit<Address, 'complement'> & { complement?: string }
  items: { description: string; quantity: number; unitPrice: number }[]
}
