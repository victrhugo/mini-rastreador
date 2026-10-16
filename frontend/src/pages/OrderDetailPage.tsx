import { ArrowLeftIcon, ArrowSquareOutIcon, MapPinIcon, PhoneIcon, ReceiptIcon, XCircleIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useOrder } from '../api/orders'
import { LiveIndicator } from '../components/LiveIndicator'
import { StatusActions } from '../components/StatusActions'
import { StatusBadge } from '../components/StatusBadge'
import { StatusStepper } from '../components/StatusStepper'
import { StatusTimeline } from '../components/StatusTimeline'
import { Alert, Avatar, buttonClass, Card, Skeleton } from '../components/ui'
import { formatDateTime, formatMoney, formatRelative } from '../format'
import { STATUS } from '../status'
import type { Order } from '../types'

export function OrderDetailPage() {
  const id = Number(useParams().id)
  const { data: order, isPending, isError, error, dataUpdatedAt, isFetching } = useOrder(id)

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink">
        <ArrowLeftIcon className="size-4" />
        Pedidos
      </Link>

      {isPending && <DetailSkeleton />}

      {isError &&
        (error instanceof ApiError && error.status === 404 ? (
          <NotFound id={id} />
        ) : (
          <Alert>{error.message}</Alert>
        ))}

      {order && <OrderDetail order={order} updatedAt={dataUpdatedAt} fetching={isFetching} />}
    </div>
  )
}

function OrderDetail({ order, updatedAt, fetching }: { order: Order; updatedAt: number; fetching: boolean }) {
  const { Icon, label, description } = STATUS[order.status]
  const cancelled = order.status === 'CANCELADO'
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${order.address.street}, ${order.address.number}, ${order.address.city}, ${order.address.zipCode}`,
  )}`

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              Pedido <span className="font-mono">#{order.id}</span>
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            Criado {formatRelative(order.createdAt)} por {order.createdBy}, em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <LiveIndicator updatedAt={updatedAt} fetching={fetching} />
      </header>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className={`st-${order.status} flex items-center gap-3.5`}>
            <span className="st-soft flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-6" weight="fill" />
            </span>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-ink-2">{description}</p>
            </div>
          </div>
          <StatusActions order={order} />
        </div>
        <div className="p-5 sm:px-6 sm:py-6">
          {cancelled && (
            <div className="st-CANCELADO st-soft mb-5 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm">
              <XCircleIcon className="size-4 shrink-0" weight="bold" />
              Cancelado {formatRelative(order.updatedAt)}, antes de sair para entrega.
            </div>
          )}
          <StatusStepper status={order.status} history={order.history} />
        </div>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Section
          title="Itens do pedido"
          aside={<span className="text-sm text-ink-3">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>}
        >
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-surface-2 px-1.5 font-mono text-xs font-medium tabular-nums">
                  {item.quantity}x
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-ink-3 tabular-nums">{formatMoney(item.unitPrice)} cada</p>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-line-strong pt-4">
            <span className="text-sm text-ink-2">Total</span>
            <span className="text-xl font-semibold tracking-tight tabular-nums">{formatMoney(order.total)}</span>
          </div>
        </Section>

        <div className="space-y-6">
          <Section title="Entrega">
            <div className="flex items-center gap-3">
              <Avatar name={order.customer.name} className="size-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-medium">{order.customer.name}</p>
                {order.customer.phone ? (
                  <a
                    href={`tel:${order.customer.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-accent"
                  >
                    <PhoneIcon className="size-3.5" />
                    {order.customer.phone}
                  </a>
                ) : (
                  <p className="text-sm text-ink-3">Sem telefone</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3 rounded-lg bg-surface-2/70 p-3.5">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-accent" weight="fill" />
              <address className="text-sm not-italic leading-relaxed text-ink-2">
                <span className="font-medium text-ink">
                  {order.address.street}, {order.address.number}
                </span>
                {order.address.complement && <>, {order.address.complement}</>}
                <br />
                {order.address.district}, {order.address.city}
                <br />
                CEP {order.address.zipCode}
              </address>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('secondary', 'sm', 'mt-3 w-full')}
            >
              Abrir no mapa
              <ArrowSquareOutIcon className="size-3.5" />
            </a>
          </Section>

          <Section title="Histórico">
            <StatusTimeline history={order.history} />
          </Section>
        </div>
      </div>
    </>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  )
}

function NotFound({ id }: { id: number }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
        <ReceiptIcon className="size-6" />
      </span>
      <p className="mt-4 font-semibold">Pedido #{id} não encontrado</p>
      <p className="mt-1 text-sm text-ink-2">Confira o número ou volte para a lista de pedidos.</p>
      <Link to="/orders" className={buttonClass('secondary', 'md', 'mt-5')}>Ver pedidos</Link>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card className="space-y-6 p-5">
        <Skeleton className="h-11 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-14" />)}
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
