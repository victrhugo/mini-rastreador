import { useUpdateOrderStatus } from '../api/orders'
import { STATUS } from '../status'
import type { Order } from '../types'
import { Alert, Button } from './ui'

/**
 * Botões de transição. Só exibe o que a API informa em allowedTransitions,
 * então as regras da máquina de estados ficam apenas no back-end.
 */
export function StatusActions({ order }: { order: Order }) {
  const mutation = useUpdateOrderStatus(order.id)

  if (order.allowedTransitions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Pedido {STATUS[order.status].label.toLowerCase()}. Não há mais ações disponíveis.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {order.allowedTransitions.map((next) => {
          const isCancel = next === 'CANCELADO'
          return (
            <Button
              key={next}
              variant={isCancel ? 'danger' : 'primary'}
              disabled={mutation.isPending}
              onClick={() => {
                if (isCancel && !window.confirm(`Cancelar o pedido #${order.id}?`)) return
                mutation.mutate(next)
              }}
            >
              {STATUS[next].action}
            </Button>
          )
        })}
      </div>
      {mutation.isError && <Alert>{mutation.error.message}</Alert>}
    </div>
  )
}
