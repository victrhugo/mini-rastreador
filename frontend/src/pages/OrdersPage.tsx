import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  KanbanIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  MopedIcon,
  PlusIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useOrders } from '../api/orders'
import { LiveIndicator } from '../components/LiveIndicator'
import { QuickActions } from '../components/StatusActions'
import { StatusBadge } from '../components/StatusBadge'
import { StatusProgress } from '../components/StatusProgress'
import { Alert, buttonClass, Card, Skeleton } from '../components/ui'
import { formatMoney, formatRelative, isToday } from '../format'
import { DELIVERY_STEPS, STATUS } from '../status'
import { ORDER_STATUSES, type Order, type OrderStatus } from '../types'

type Filter = OrderStatus | 'TODOS'
type View = 'list' | 'board'

const VIEW_KEY = 'rastreador.ordersView'

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

export function OrdersPage() {
  const { data: orders, isPending, isError, error, dataUpdatedAt, isFetching } = useOrders()
  const [filter, setFilter] = useState<Filter>('TODOS')
  const [query, setQuery] = useState('')
  const [view, setViewState] = useState<View>(readView)

  const setView = (next: View) => {
    setViewState(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // preferência só nesta sessão
    }
  }

  const searched = useMemo(() => search(orders ?? [], query), [orders, query])
  const visible = filter === 'TODOS' ? searched : searched.filter((order) => order.status === filter)
  const countBy = (status: OrderStatus) => searched.filter((order) => order.status === status).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Pedidos</h1>
          <div className="mt-1.5 h-4">
            {orders && <LiveIndicator updatedAt={dataUpdatedAt} fetching={isFetching} />}
          </div>
        </div>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft sm:w-72">
            <MagnifyingGlassIcon className="size-4 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, rua ou nº"
              aria-label="Buscar pedidos"
              className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-3"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Limpar busca" className="text-ink-3 hover:text-ink">
                <XIcon className="size-3.5" weight="bold" />
              </button>
            )}
          </label>
          <Link to="/orders/new" className={buttonClass('primary', 'md')}>
            <PlusIcon className="size-4" weight="bold" />
            Novo pedido
          </Link>
        </div>
      </header>

      <Kpis orders={orders} loading={isPending} />

      <div className="flex items-center justify-between gap-3">
        {view === 'list' ? (
          <div
            className="-ml-4 flex min-w-0 gap-1.5 overflow-x-auto py-1 pl-4 [scrollbar-width:none] lg:ml-0 lg:pl-0"
            role="tablist"
            aria-label="Filtrar por status"
          >
            <FilterChip active={filter === 'TODOS'} onClick={() => setFilter('TODOS')} label="Todos" count={searched.length} />
            {ORDER_STATUSES.map((status) => (
              <FilterChip
                key={status}
                status={status}
                active={filter === status}
                onClick={() => setFilter(status)}
                label={STATUS[status].label}
                count={countBy(status)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-2">Avance os pedidos direto pelos cartões.</p>
        )}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isError && <Alert>{error.message}</Alert>}

      {isPending ? (
        <ListSkeleton />
      ) : view === 'board' ? (
        <Board orders={searched} onShowCancelled={() => { setView('list'); setFilter('CANCELADO') }} />
      ) : visible.length > 0 ? (
        <OrderList orders={visible} />
      ) : (
        <EmptyState hasOrders={(orders?.length ?? 0) > 0} onReset={() => { setFilter('TODOS'); setQuery('') }} />
      )}
    </div>
  )
}

function search(orders: Order[], query: string) {
  const term = query.trim().toLowerCase()
  if (!term) return orders
  return orders.filter((order) =>
    [String(order.id), order.customer.name, order.address.street, order.address.district]
      .some((value) => value.toLowerCase().includes(term.replace(/^#/, ''))),
  )
}

/* ---------- Indicadores ---------- */

function Kpis({ orders, loading }: { orders?: Order[]; loading: boolean }) {
  const list = orders ?? []
  const open = list.filter((o) => !['ENTREGUE', 'CANCELADO'].includes(o.status)).length
  const onRoute = list.filter((o) => o.status === 'SAIU_PARA_ENTREGA').length
  const deliveredToday = list.filter((o) => o.status === 'ENTREGUE' && isToday(o.updatedAt)).length
  const salesToday = list
    .filter((o) => o.status !== 'CANCELADO' && isToday(o.createdAt))
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Em andamento" value={open} Icon={ClockIcon} loading={loading} />
      <Kpi label="Em rota agora" value={onRoute} Icon={MopedIcon} loading={loading} />
      <Kpi label="Entregues hoje" value={deliveredToday} Icon={CheckCircleIcon} loading={loading} />
      <Kpi label="Vendas de hoje" value={formatMoney(salesToday)} Icon={CurrencyCircleDollarIcon} loading={loading} highlight />
    </div>
  )
}

function Kpi({ label, value, Icon, loading, highlight }: {
  label: string
  value: ReactNode
  Icon: Icon
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-2">{label}</p>
        <Icon className={`size-[18px] ${highlight ? 'text-accent' : 'text-ink-3'}`} />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
    </Card>
  )
}

/* ---------- Lista ---------- */

function OrderList({ orders }: { orders: Order[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="hidden grid-cols-[96px_minmax(0,1.6fr)_120px_180px_212px] gap-4 border-b border-line bg-surface-2/50 px-5 py-2.5 text-xs font-medium text-ink-3 md:grid">
        <span>Pedido</span>
        <span>Cliente</span>
        <span className="text-right">Total</span>
        <span>Status</span>
        <span className="text-right">Ações</span>
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <motion.li
              key={order.id}
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-line last:border-b-0"
            >
              <OrderRow order={order} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  )
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-surface-2/60 md:grid-cols-[96px_minmax(0,1.6fr)_120px_180px_212px]">
      <Link
        to={`/orders/${order.id}`}
        className="absolute inset-0 rounded-none focus-visible:outline-offset-[-2px]"
        aria-label={`Abrir pedido ${order.id} de ${order.customer.name}`}
      />
      <div className="hidden md:block">
        <p className="font-mono text-sm font-medium">#{order.id}</p>
        <p className="mt-0.5 text-xs text-ink-3">{formatRelative(order.createdAt)}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">
          <span className="mr-2 font-mono text-xs font-normal text-ink-3 md:hidden">#{order.id}</span>
          {order.customer.name}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink-2">
          {order.address.street}, {order.address.number}, {order.address.district}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium tabular-nums">{formatMoney(order.total)}</p>
        <p className="mt-0.5 text-xs text-ink-3">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
      </div>
      <div className="col-span-2 flex flex-col items-start gap-2 md:col-span-1">
        <StatusBadge status={order.status} size="sm" />
        <div className="w-full max-w-[160px]"><StatusProgress order={order} /></div>
      </div>
      <div className="relative col-span-2 flex justify-start md:col-span-1 md:justify-end">
        <QuickActions order={order} />
      </div>
    </div>
  )
}

/* ---------- Quadro ---------- */

/** Quadro com as quatro etapas do fluxo; cancelados ficam na lista (atalho no rodapé). */
function Board({ orders, onShowCancelled }: { orders: Order[]; onShowCancelled: () => void }) {
  const cancelled = orders.filter((order) => order.status === 'CANCELADO').length
  return (
    <div className="space-y-3">
      <div className="-mx-4 grid snap-x snap-mandatory scroll-px-4 auto-cols-[minmax(264px,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:px-0">
        {DELIVERY_STEPS.map((status) => {
          const column = orders.filter((order) => order.status === status)
          const { label, Icon } = STATUS[status]
          return (
            <section key={status} className="snap-start rounded-xl bg-surface-2/70 p-2" aria-label={label}>
              <header className={`st-${status} flex items-center gap-2 px-2 pt-1.5 pb-3`}>
                <Icon className="st-text size-4" weight="bold" />
                <h2 className="text-sm font-semibold">{label}</h2>
                <span className="ml-auto rounded-full bg-surface px-2 text-xs font-medium tabular-nums text-ink-2">{column.length}</span>
              </header>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {column.map((order) => (
                    <motion.li
                      key={order.id}
                      layout
                      layoutId={`board-${order.id}`}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    >
                      <BoardCard order={order} />
                    </motion.li>
                  ))}
                </AnimatePresence>
                {column.length === 0 && (
                  <li className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-3">
                    Nenhum pedido
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
      {cancelled > 0 && (
        <button onClick={onShowCancelled} className="text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          {cancelled === 1 ? '1 pedido cancelado' : `${cancelled} pedidos cancelados`}, ver na lista
        </button>
      )}
    </div>
  )
}

function BoardCard({ order }: { order: Order }) {
  return (
    <div className="relative rounded-lg border border-line bg-surface p-3.5 shadow-card transition-shadow hover:shadow-pop">
      <Link to={`/orders/${order.id}`} className="absolute inset-0 rounded-lg" aria-label={`Abrir pedido ${order.id}`} />
      <div className="flex items-center justify-between text-xs text-ink-3">
        <span className="font-mono">#{order.id}</span>
        <span>{formatRelative(order.createdAt)}</span>
      </div>
      <p className="mt-1.5 truncate font-medium">{order.customer.name}</p>
      <p className="truncate text-[13px] text-ink-2">{order.address.street}, {order.address.number}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium tabular-nums">{formatMoney(order.total)}</span>
        <div className="relative"><QuickActions order={order} /></div>
      </div>
    </div>
  )
}

/* ---------- Controles e estados ---------- */

function FilterChip({ active, label, count, status, onClick }: {
  active: boolean
  label: string
  count: number
  status?: OrderStatus
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
        active
          ? 'bg-ink text-canvas'
          : 'bg-surface text-ink-2 ring-1 ring-inset ring-line hover:text-ink hover:ring-line-strong'
      }`}
    >
      {status && <span className={`st-${status} st-fill size-1.5 rounded-full`} />}
      {label}
      <span className={`tabular-nums ${active ? 'text-canvas/60' : 'text-ink-3'}`}>{count}</span>
    </button>
  )
}

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const options: { value: View; label: string; Icon: Icon }[] = [
    { value: 'list', label: 'Lista', Icon: ListBulletsIcon },
    { value: 'board', label: 'Quadro', Icon: KanbanIcon },
  ]
  return (
    <div role="radiogroup" aria-label="Visualização" className="flex h-9 rounded-lg bg-surface-2 p-0.5">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={view === value}
          onClick={() => onChange(value)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
            view === value ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

function EmptyState({ hasOrders, onReset }: { hasOrders: boolean; onReset: () => void }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {hasOrders ? <MagnifyingGlassIcon className="size-6" /> : <PlusIcon className="size-6" weight="bold" />}
      </span>
      <p className="mt-4 font-semibold">{hasOrders ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}</p>
      <p className="mt-1 max-w-[36ch] text-sm text-ink-2">
        {hasOrders
          ? 'Ajuste a busca ou o filtro de status para ver outros pedidos.'
          : 'Cadastre o primeiro pedido para começar a acompanhar as entregas.'}
      </p>
      {hasOrders ? (
        <button onClick={onReset} className={buttonClass('secondary', 'md', 'mt-5')}>Limpar filtros</button>
      ) : (
        <Link to="/orders/new" className={buttonClass('primary', 'md', 'mt-5')}>
          <PlusIcon className="size-4" weight="bold" />
          Novo pedido
        </Link>
      )}
    </Card>
  )
}

function ListSkeleton() {
  return (
    <Card className="divide-y divide-line" aria-busy="true">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="flex items-center gap-6 px-5 py-4">
          <Skeleton className="hidden h-4 w-14 md:block" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      ))}
    </Card>
  )
}
