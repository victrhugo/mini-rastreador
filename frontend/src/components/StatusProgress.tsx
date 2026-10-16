import { DELIVERY_STEPS, reachedStep } from '../status'
import type { Order } from '../types'

/** Versão compacta do rastreio para listas: quatro segmentos na cor do status atual. */
export function StatusProgress({ order }: { order: Order }) {
  const reached = reachedStep(order.status, order.history)
  const cancelled = order.status === 'CANCELADO'

  return (
    <div className={`st-${order.status} flex gap-1`} aria-hidden="true">
      {DELIVERY_STEPS.map((step, index) => (
        <span
          key={step}
          className={`h-1 flex-1 rounded-full ${index <= reached ? (cancelled ? 'bg-line-strong' : 'st-fill') : 'bg-line'}`}
        />
      ))}
    </div>
  )
}
