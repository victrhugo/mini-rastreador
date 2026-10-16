import { ArrowRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useUpdateOrderStatus } from '../api/orders'
import { nextStep, STATUS } from '../status'
import type { Order, OrderStatus } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'
import { Button } from './ui'

/** Muda o status e avisa o resultado com um toast. */
function useStatusChange(order: Order) {
  const mutation = useUpdateOrderStatus(order.id)
  const toast = useToast()

  const change = (next: OrderStatus, onDone?: () => void) =>
    mutation.mutate(next, {
      onSuccess: () => toast(`Pedido #${order.id} ${STATUS[next].done}`),
      onError: (error) => toast(error.message, 'error'),
      onSettled: onDone,
    })

  return { change, pending: mutation.isPending }
}

/**
 * Ações do detalhe do pedido. Os botões vêm de allowedTransitions, então as
 * regras da máquina de estados ficam apenas no back-end.
 */
export function StatusActions({ order }: { order: Order }) {
  const { change, pending } = useStatusChange(order)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const next = nextStep(order.allowedTransitions)
  const canCancel = order.allowedTransitions.includes('CANCELADO')

  if (!next && !canCancel) return null

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
      {canCancel && (
        <Button variant="danger" disabled={pending} onClick={() => setConfirmCancel(true)}>
          Cancelar
        </Button>
      )}
      {next && (
        <NextStepButton status={next} loading={pending} onClick={() => change(next)} size="md" />
      )}
      <ConfirmDialog
        open={confirmCancel}
        title={`Cancelar o pedido #${order.id}?`}
        confirmLabel="Cancelar pedido"
        loading={pending}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => change('CANCELADO', () => setConfirmCancel(false))}
      >
        O cliente {order.customer.name} não vai receber este pedido. Essa ação não pode ser desfeita.
      </ConfirmDialog>
    </div>
  )
}

/** Atalho para avançar o pedido direto da lista ou do quadro. */
export function QuickAdvance({ order }: { order: Order }) {
  const { change, pending } = useStatusChange(order)
  const next = nextStep(order.allowedTransitions)
  if (!next) return null
  return <NextStepButton status={next} loading={pending} onClick={() => change(next)} size="sm" />
}

function NextStepButton({ status, loading, onClick, size }: {
  status: OrderStatus
  loading: boolean
  onClick: () => void
  size: 'sm' | 'md'
}) {
  const { Icon, action } = STATUS[status]
  return (
    <Button
      size={size}
      variant={size === 'sm' ? 'secondary' : 'primary'}
      loading={loading}
      icon={<Icon className="size-4" weight="bold" />}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
    >
      {action}
      {size === 'md' && <ArrowRightIcon className="size-4" weight="bold" />}
    </Button>
  )
}
