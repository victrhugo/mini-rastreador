import { DELIVERY_STEPS, STATUS } from '../status'
import type { Order } from '../types'

/**
 * Barra de etapas do pedido. Para pedidos cancelados, mostra até onde o
 * pedido chegou antes do cancelamento.
 */
export function StatusProgress({ order, showLabels = false }: { order: Order; showLabels?: boolean }) {
  const cancelled = order.status === 'CANCELADO'
  const reached = cancelled
    ? (order.history.at(-1)?.from ?? 'RECEBIDO')
    : order.status
  const reachedIndex = DELIVERY_STEPS.indexOf(reached)

  return (
    <div>
      <div className="flex items-center gap-1" aria-label={`Etapa atual: ${STATUS[order.status].label}`}>
        {DELIVERY_STEPS.map((step, index) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              index <= reachedIndex ? (cancelled ? 'bg-slate-300' : 'bg-orange-500') : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 grid grid-cols-4 text-xs text-slate-500">
          {DELIVERY_STEPS.map((step, index) => (
            <span
              key={step}
              className={`${index === 0 ? 'text-left' : index === DELIVERY_STEPS.length - 1 ? 'text-right' : 'text-center'} ${
                index === reachedIndex && !cancelled ? 'font-medium text-slate-900' : ''
              }`}
            >
              {STATUS[step].label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
