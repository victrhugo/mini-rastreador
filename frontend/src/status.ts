import type { OrderStatus } from './types'

interface StatusMeta {
  label: string
  /** Texto do botão que leva o pedido a este status. */
  action: string
  badge: string
  dot: string
}

export const STATUS: Record<OrderStatus, StatusMeta> = {
  RECEBIDO: {
    label: 'Recebido',
    action: 'Receber',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  EM_PREPARO: {
    label: 'Em preparo',
    action: 'Iniciar preparo',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  SAIU_PARA_ENTREGA: {
    label: 'Saiu para entrega',
    action: 'Enviar para entrega',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
  },
  ENTREGUE: {
    label: 'Entregue',
    action: 'Confirmar entrega',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELADO: {
    label: 'Cancelado',
    action: 'Cancelar pedido',
    badge: 'bg-slate-100 text-slate-600 ring-slate-300',
    dot: 'bg-slate-400',
  },
}

/** Etapas do fluxo feliz, na ordem em que acontecem. */
export const DELIVERY_STEPS: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']
