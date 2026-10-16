import { MapPinIcon, ReceiptIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { API_URL, ApiError } from '../api/client'
import { trackingKey, usePublicTracking } from '../api/tracking'
import { LiveIndicator } from '../components/LiveIndicator'
import { Logo } from '../components/Logo'
import { StatusStepper } from '../components/StatusStepper'
import { ThemeToggle } from '../components/ThemeToggle'
import { Alert, Card, Skeleton } from '../components/ui'
import { formatMoney, formatTime } from '../format'
import { STATUS } from '../status'
import type { OrderStatus, PublicTracking, StatusChange } from '../types'

/** Mensagens escritas para o cliente final, não para o operador. */
const CUSTOMER_MESSAGE: Record<OrderStatus, { title: string; text: string }> = {
  RECEBIDO: { title: 'Pedido recebido', text: 'O restaurante já recebeu seu pedido e logo começa o preparo.' },
  EM_PREPARO: { title: 'Em preparo', text: 'Seu pedido está sendo preparado com cuidado.' },
  SAIU_PARA_ENTREGA: { title: 'A caminho', text: 'Seu pedido saiu para entrega e já está a caminho.' },
  ENTREGUE: { title: 'Entregue', text: 'Seu pedido foi entregue. Bom apetite!' },
  CANCELADO: { title: 'Pedido cancelado', text: 'Este pedido foi cancelado. Em caso de dúvida, fale com o restaurante.' },
}

export function TrackingPage() {
  const code = useParams().code ?? ''
  const { data, isPending, isError, error, dataUpdatedAt, isFetching } = usePublicTracking(code)
  const live = useTrackingEvents(code, Boolean(data))

  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-12 sm:px-6">
        {isPending && <TrackingSkeleton />}

        {isError &&
          (error instanceof ApiError && error.status === 404 ? (
            <Card className="px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
                <ReceiptIcon className="size-6" />
              </span>
              <h1 className="mt-4 text-lg font-semibold">Pedido não encontrado</h1>
              <p className="mt-1 text-sm text-ink-2">Confira se o link de rastreio está completo.</p>
            </Card>
          ) : (
            <Alert>{error.message}</Alert>
          ))}

        {data && <Tracking tracking={data} updatedAt={dataUpdatedAt} fetching={isFetching} live={live} />}
      </main>
    </div>
  )
}

function Tracking({ tracking, updatedAt, fetching, live }: {
  tracking: PublicTracking
  updatedAt: number
  fetching: boolean
  live: boolean
}) {
  const { Icon } = STATUS[tracking.status]
  const message = CUSTOMER_MESSAGE[tracking.status]
  const itemCount = tracking.items.reduce((sum, item) => sum + item.quantity, 0)

  // O stepper usa o formato do histórico interno; aqui só importam etapa e horário.
  const history: StatusChange[] = tracking.history.map((step, index) => ({
    from: index === 0 ? null : tracking.history[index - 1].status,
    to: step.status,
    changedBy: '',
    changedAt: step.at,
  }))

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <p className="font-mono text-xs text-ink-3">Pedido #{tracking.orderNumber}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Olá, {tracking.customerFirstName}!</h1>

          <div className={`st-${tracking.status} mt-5 flex items-center gap-4`}>
            <span className="st-soft flex size-14 shrink-0 items-center justify-center rounded-2xl">
              <Icon className="size-7" weight="fill" />
            </span>
            <div>
              <p className="text-lg font-semibold">{message.title}</p>
              <p className="text-sm text-ink-2">{message.text}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-line p-5 sm:p-6">
          <StatusStepper status={tracking.status} history={history} />
        </div>
      </Card>

      <Card className="divide-y divide-line">
        <div className="flex gap-3 p-5">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-accent" weight="fill" />
          <p className="text-sm text-ink-2">
            Entrega em <span className="font-medium text-ink">{tracking.district}</span>, {tracking.city}
            {tracking.state && `, ${tracking.state}`}
          </p>
        </div>
        <div className="p-5">
          <p className="mb-3 text-sm font-semibold">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </p>
          <ul className="space-y-2 text-sm">
            {tracking.items.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-mono text-xs leading-5 text-ink-3">{item.quantity}x</span>
                <span className="text-ink-2">{item.description}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line-strong pt-4">
            <span className="text-sm text-ink-2">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatMoney(tracking.total)}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink-3">
        <LiveIndicator updatedAt={updatedAt} fetching={fetching} live={live} />
        <span>Pedido feito às {formatTime(tracking.createdAt)}</span>
      </div>
    </>
  )
}

/**
 * Escuta as mudanças do pedido em tempo real com o EventSource nativo (a rota é pública).
 * Ele reconecta sozinho em quedas de rede, mas desiste se receber um status diferente
 * de 200 (ex.: 502 enquanto a API reinicia); nesse caso abrimos uma nova conexão com espera.
 */
function useTrackingEvents(code: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const [live, setLive] = useState(false)
  // `attempt` só serve para recriar a conexão; `failures` controla a espera entre tentativas.
  const [attempt, setAttempt] = useState(0)
  const failures = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const refresh = () => queryClient.invalidateQueries({ queryKey: trackingKey(code) })
    const source = new EventSource(`${API_URL}/api/public/tracking/${encodeURIComponent(code)}/stream`)
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    source.addEventListener('ready', () => {
      failures.current = 0
      setLive(true)
      refresh() // recupera mudanças feitas enquanto a conexão estava fora
    })
    source.addEventListener('order', refresh)
    source.onerror = () => {
      setLive(false)
      if (source.readyState === EventSource.CLOSED) {
        const delay = Math.min(15_000, 1_000 * 2 ** failures.current++)
        retryTimer = setTimeout(() => setAttempt((n) => n + 1), delay)
      }
    }

    return () => {
      clearTimeout(retryTimer)
      source.close()
    }
  }, [code, enabled, queryClient, attempt])

  return live
}

function TrackingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Card className="space-y-5 p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-12" />)}
        </div>
      </Card>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
