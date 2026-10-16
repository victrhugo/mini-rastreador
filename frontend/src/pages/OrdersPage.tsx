import { useState } from 'react'
import { Link } from 'react-router'
import { useOrders } from '../api/orders'
import { LiveIndicator } from '../components/LiveIndicator'
import { StatusBadge } from '../components/StatusBadge'
import { StatusProgress } from '../components/StatusProgress'
import { Alert, Card } from '../components/ui'
import { formatMoney, formatRelative } from '../format'
import { STATUS } from '../status'
import { ORDER_STATUSES, type Order, type OrderStatus } from '../types'

type Filter = OrderStatus | 'TODOS'

export function OrdersPage() {
  const { data: orders, isPending, isError, error, dataUpdatedAt, isFetching } = useOrders()
  const [filter, setFilter] = useState<Filter>('TODOS')

  const visible = filter === 'TODOS' ? orders : orders?.filter((order) => order.status === filter)
  const countBy = (status: OrderStatus) => orders?.filter((order) => order.status === status).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          {orders && <LiveIndicator updatedAt={dataUpdatedAt} fetching={isFetching} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por status">
        <FilterChip active={filter === 'TODOS'} onClick={() => setFilter('TODOS')}
          label="Todos" count={orders?.length ?? 0} />
        {ORDER_STATUSES.map((status) => (
          <FilterChip key={status} active={filter === status} onClick={() => setFilter(status)}
            label={STATUS[status].label} count={countBy(status)} />
        ))}
      </div>

      {isError && <Alert>{error.message}</Alert>}

      <Card>
        {isPending ? (
          <ListSkeleton />
        ) : visible && visible.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {visible.map((order) => <OrderRow key={order.id} order={order} />)}
          </ul>
        ) : (
          <EmptyState filtered={filter !== 'TODOS'} />
        )}
      </Card>
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <li>
      <Link to={`/orders/${order.id}`} className="block px-5 py-4 transition-colors hover:bg-slate-50">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">#{order.id}</span>
              <span className="truncate font-medium">{order.customer.name}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {order.address.street}, {order.address.number} · {order.address.district}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            <span className="font-medium tabular-nums">{formatMoney(order.total)}</span>
            <StatusBadge status={order.status} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1"><StatusProgress order={order} /></div>
          <span className="w-28 text-right text-xs text-slate-400">{formatRelative(order.createdAt)}</span>
        </div>
      </Link>
    </li>
  )
}

function FilterChip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100'
      }`}
    >
      {label} <span className={active ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
    </button>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-medium">{filtered ? 'Nenhum pedido com esse status' : 'Nenhum pedido ainda'}</p>
      <p className="mt-1 text-sm text-slate-500">
        {filtered ? 'Troque o filtro para ver outros pedidos.' : 'Os pedidos criados aparecem aqui.'}
      </p>
    </div>
  )
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-slate-100" aria-busy="true">
      {[0, 1, 2].map((key) => (
        <li key={key} className="animate-pulse px-5 py-4">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          <div className="mt-4 h-1.5 rounded bg-slate-100" />
        </li>
      ))}
    </ul>
  )
}
