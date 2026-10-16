import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useOrder } from '../api/orders'
import { LiveIndicator } from '../components/LiveIndicator'
import { StatusActions } from '../components/StatusActions'
import { StatusBadge } from '../components/StatusBadge'
import { StatusProgress } from '../components/StatusProgress'
import { StatusTimeline } from '../components/StatusTimeline'
import { Alert, Card } from '../components/ui'
import { formatDateTime, formatMoney } from '../format'

export function OrderDetailPage() {
  const id = Number(useParams().id)
  const { data: order, isPending, isError, error, dataUpdatedAt, isFetching } = useOrder(id)

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        ← Voltar para pedidos
      </Link>

      {isPending && <p className="text-sm text-slate-500">Carregando pedido…</p>}

      {isError && (
        <Alert>
          {error instanceof ApiError && error.status === 404 ? `Pedido #${id} não encontrado.` : error.message}
        </Alert>
      )}

      {order && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Pedido #{order.id}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Criado em {formatDateTime(order.createdAt)} por {order.createdBy}
              </p>
            </div>
            <LiveIndicator updatedAt={dataUpdatedAt} fetching={isFetching} />
          </div>

          <Card className="space-y-5 p-5">
            <StatusProgress order={order} showLabels />
            <StatusActions order={order} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title="Itens">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="pb-2 font-medium">Descrição</th>
                      <th className="pb-2 text-right font-medium">Qtd.</th>
                      <th className="pb-2 text-right font-medium">Unitário</th>
                      <th className="pb-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                        <td className="py-2 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                        <td className="py-2 text-right tabular-nums">{formatMoney(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="pt-3 font-medium">Total</td>
                      <td className="pt-3 text-right font-semibold tabular-nums">{formatMoney(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </Section>

              <div className="grid gap-6 sm:grid-cols-2">
                <Section title="Cliente">
                  <p className="font-medium">{order.customer.name}</p>
                  {order.customer.phone && <p className="text-sm text-slate-500">{order.customer.phone}</p>}
                </Section>
                <Section title="Endereço de entrega">
                  <address className="text-sm not-italic text-slate-700">
                    {order.address.street}, {order.address.number}
                    {order.address.complement && ` · ${order.address.complement}`}
                    <br />
                    {order.address.district} · {order.address.city}
                    <br />
                    CEP {order.address.zipCode}
                  </address>
                </Section>
              </div>
            </div>

            <Section title="Histórico">
              <StatusTimeline history={order.history} />
            </Section>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </Card>
  )
}
