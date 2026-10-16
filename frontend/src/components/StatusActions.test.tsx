import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Order, OrderStatus } from '../types'
import { StatusActions } from './StatusActions'
import { ToastProvider } from './Toast'

function makeOrder(status: OrderStatus, allowedTransitions: OrderStatus[]): Order {
  return {
    id: 42,
    status,
    allowedTransitions,
    total: 49.9,
    customer: { name: 'Ana Souza', phone: null },
    address: { street: 'Rua A', number: '1', complement: null, district: 'Centro', city: 'São Paulo', state: 'SP', zipCode: '01000-000' },
    items: [],
    history: [],
    createdBy: 'Operador',
    createdAt: '2026-10-16T12:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z',
    version: 3,
    stageStartedAt: '2026-10-16T12:00:00Z',
    stageDeadline: null,
    delayed: false,
    trackingCode: 'abc123',
  }
}

function renderActions(order: Order) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <StatusActions order={order} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('StatusActions', () => {
  it('mostra apenas as ações que a API permite', () => {
    renderActions(makeOrder('RECEBIDO', ['EM_PREPARO', 'CANCELADO']))

    expect(screen.getByRole('button', { name: /iniciar preparo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toBeInTheDocument()
  })

  it('não oferece cancelamento depois que o pedido saiu para entrega', () => {
    renderActions(makeOrder('SAIU_PARA_ENTREGA', ['ENTREGUE']))

    expect(screen.getByRole('button', { name: /confirmar entrega/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('não oferece nenhuma ação para pedidos finalizados', () => {
    renderActions(makeOrder('ENTREGUE', []))
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('envia o novo status com a versão que o usuário está vendo', async () => {
    const fetchMock = mockFetch(200, makeOrder('EM_PREPARO', ['SAIU_PARA_ENTREGA', 'CANCELADO']))
    renderActions(makeOrder('RECEBIDO', ['EM_PREPARO', 'CANCELADO']))

    await userEvent.click(screen.getByRole('button', { name: /iniciar preparo/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/orders/42/status')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ status: 'EM_PREPARO', version: 3 })
    expect(await screen.findByText('Pedido #42 em preparo')).toBeInTheDocument()
  })

  it('pede confirmação antes de cancelar', async () => {
    const fetchMock = mockFetch(200, makeOrder('CANCELADO', []))
    renderActions(makeOrder('RECEBIDO', ['EM_PREPARO', 'CANCELADO']))

    await userEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Cancelar o pedido #42?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ status: 'CANCELADO', version: 3 })
  })

  it('mostra a mensagem da API quando a alteração é recusada', async () => {
    mockFetch(409, { detail: 'O pedido 42 foi alterado por outra pessoa. Atualize a tela e tente novamente.' })
    renderActions(makeOrder('RECEBIDO', ['EM_PREPARO', 'CANCELADO']))

    await userEvent.click(screen.getByRole('button', { name: /iniciar preparo/i }))

    expect(await screen.findByText(/alterado por outra pessoa/)).toBeInTheDocument()
  })
})
