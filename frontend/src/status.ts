import {
  CheckCircleIcon,
  CookingPotIcon,
  MopedIcon,
  ReceiptIcon,
  XCircleIcon,
  type Icon,
} from '@phosphor-icons/react'
import type { OrderStatus, StatusChange } from './types'

interface StatusMeta {
  label: string
  /** Frase curta que explica o momento do pedido. */
  description: string
  /** Texto do botão que leva o pedido a este status. */
  action: string
  /** Mensagem exibida depois que o pedido chega a este status. */
  done: string
  Icon: Icon
}

export const STATUS: Record<OrderStatus, StatusMeta> = {
  RECEBIDO: {
    label: 'Recebido',
    description: 'Aguardando a cozinha começar',
    action: 'Receber',
    done: 'recebido',
    Icon: ReceiptIcon,
  },
  EM_PREPARO: {
    label: 'Em preparo',
    description: 'A cozinha está preparando o pedido',
    action: 'Iniciar preparo',
    done: 'em preparo',
    Icon: CookingPotIcon,
  },
  SAIU_PARA_ENTREGA: {
    label: 'Saiu para entrega',
    description: 'O entregador está a caminho',
    action: 'Despachar',
    done: 'saiu para entrega',
    Icon: MopedIcon,
  },
  ENTREGUE: {
    label: 'Entregue',
    description: 'Pedido entregue ao cliente',
    action: 'Confirmar entrega',
    done: 'entregue',
    Icon: CheckCircleIcon,
  },
  CANCELADO: {
    label: 'Cancelado',
    description: 'Pedido cancelado antes da entrega',
    action: 'Cancelar pedido',
    done: 'cancelado',
    Icon: XCircleIcon,
  },
}

/** Etapas do fluxo feliz, na ordem em que acontecem. */
export const DELIVERY_STEPS: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']

/** Próximo passo do fluxo (ignora o cancelamento), se houver. */
export function nextStep(allowed: OrderStatus[]) {
  return allowed.find((status) => status !== 'CANCELADO')
}

/** Até qual etapa do fluxo o pedido chegou (para cancelados, a etapa em que parou). */
export function reachedStep(status: OrderStatus, history: StatusChange[] = []) {
  if (status !== 'CANCELADO') return DELIVERY_STEPS.indexOf(status)
  const from = history.at(-1)?.from
  return from ? DELIVERY_STEPS.indexOf(from) : 0
}
