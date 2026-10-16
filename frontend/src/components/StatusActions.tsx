import { ArrowRightIcon, XCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useUpdateOrderStatus } from '../api/orders'
import { nextStep, STATUS } from '../status'
import type { Order, OrderStatus } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'
import { Button } from './ui'

type ChangeStatus = (next: OrderStatus, onDone?: () => void) => void

/** Muda o status e avisa o resultado com um toast. */
function useStatusChange(order: Order) {
  const mutation = useUpdateOrderStatus(order.id)
  const toast = useToast()

  const change: ChangeStatus = (next, onDone) =>
    mutation.mutate({ status: next, version: order.version }, {
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
  const next = nextStep(order.allowedTransitions)
  const canCancel = order.allowedTransitions.includes('CANCELADO')

  if (!next && !canCancel) return null

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
      {canCancel && <CancelOrder order={order} change={change} pending={pending} />}
      {next && <NextStepButton status={next} loading={pending} onClick={() => change(next)} size="md" />}
    </div>
  )
}

/** Versão compacta para a lista e o quadro: avançar etapa e cancelar. */
export function QuickActions({ order }: { order: Order }) {
  const { change, pending } = useStatusChange(order)
  const next = nextStep(order.allowedTransitions)
  const canCancel = order.allowedTransitions.includes('CANCELADO')

  if (!next && !canCancel) return null

  return (
    <div className="flex items-center gap-1.5">
      {canCancel && <CancelOrder order={order} change={change} pending={pending} compact />}
      {next && <NextStepButton status={next} loading={pending} onClick={() => change(next)} size="sm" />}
    </div>
  )
}

function CancelOrder({ order, change, pending, compact }: {
  order: Order
  change: ChangeStatus
  pending: boolean
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {compact ? (
        <button
          type="button"
          disabled={pending}
          onClick={(event) => {
            event.stopPropagation()
            setOpen(true)
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
          aria-label={`Cancelar pedido #${order.id}`}
          title="Cancelar pedido"
        >
          <XCircleIcon className="size-[18px]" />
        </button>
      ) : (
        <Button variant="danger" disabled={pending} onClick={() => setOpen(true)}>
          Cancelar
        </Button>
      )}
      <ConfirmDialog
        open={open}
        title={`Cancelar o pedido #${order.id}?`}
        confirmLabel="Cancelar pedido"
        loading={pending}
        onClose={() => setOpen(false)}
        onConfirm={() => change('CANCELADO', () => setOpen(false))}
      >
        O pedido de {order.customer.name} não será entregue. Essa ação não pode ser desfeita.
      </ConfirmDialog>
    </>
  )
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
