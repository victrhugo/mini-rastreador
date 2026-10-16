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
  /** UF com duas letras. */
  state: string
  zipCode: string
}

/** Resposta de GET /api/address/cep/{cep}. Rua e bairro podem vir vazios (cidades com CEP único). */
export interface AddressLookup {
  zipCode: string
  street: string
  district: string
  city: string
  state: string
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
  /** Quando o pedido entrou na etapa atual. */
  stageStartedAt: string
  /** Prazo para sair da etapa atual; null em etapas sem limite (finais). */
  stageDeadline: string | null
  /** Se já estava atrasado quando a API respondeu (o front recalcula com o relógio). */
  delayed: boolean
}

export interface CreateOrderInput {
  customer: { name: string; phone?: string }
  address: Omit<Address, 'complement'> & { complement?: string }
  items: { description: string; quantity: number; unitPrice: number }[]
}
