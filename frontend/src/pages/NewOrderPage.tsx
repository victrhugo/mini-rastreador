import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useCreateOrder } from '../api/orders'
import { ItemsEditor, itemSubtotal, newItem, parsePrice, type ItemDraft } from '../components/ItemsEditor'
import { Alert, Button, Card, Field } from '../components/ui'
import { formatMoney } from '../format'
import type { CreateOrderInput } from '../types'

const emptyForm = {
  customerName: '',
  customerPhone: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  zipCode: '',
}

type FormState = typeof emptyForm

export function NewOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [items, setItems] = useState<ItemDraft[]>(() => [newItem()])

  const apiError = createOrder.error instanceof ApiError ? createOrder.error : null
  const errors = apiError?.fieldErrors ?? {}
  const total = items.reduce((sum, item) => sum + itemSubtotal(item), 0)

  const field = (name: keyof FormState) => ({
    value: form[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [name]: e.target.value })),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input: CreateOrderInput = {
      customer: { name: form.customerName, phone: form.customerPhone || undefined },
      address: {
        street: form.street,
        number: form.number,
        complement: form.complement || undefined,
        district: form.district,
        city: form.city,
        zipCode: form.zipCode,
      },
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: parsePrice(item.unitPrice),
      })),
    }
    createOrder.mutate(input, {
      onSuccess: (order) => navigate(`/orders/${order.id}`, { replace: true }),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/orders" className="text-sm text-slate-500 hover:text-slate-800">← Voltar para pedidos</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {createOrder.isError && (
          <Alert>{createOrder.error.message}{errors.items && ` ${errors.items}`}</Alert>
        )}

        <Section title="Cliente" description="Quem vai receber o pedido.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" required autoFocus {...field('customerName')} error={errors['customer.name']} />
            <Field label="Telefone (opcional)" type="tel" placeholder="(11) 99999-0000"
              {...field('customerPhone')} error={errors['customer.phone']} />
          </div>
        </Section>

        <Section title="Endereço de entrega">
          <div className="grid gap-4 sm:grid-cols-6">
            <Field className="sm:col-span-4" label="Rua" required {...field('street')} error={errors['address.street']} />
            <Field className="sm:col-span-2" label="Número" required {...field('number')} error={errors['address.number']} />
            <Field className="sm:col-span-3" label="Complemento (opcional)" {...field('complement')}
              error={errors['address.complement']} />
            <Field className="sm:col-span-3" label="Bairro" required {...field('district')} error={errors['address.district']} />
            <Field className="sm:col-span-4" label="Cidade" required {...field('city')} error={errors['address.city']} />
            <Field className="sm:col-span-2" label="CEP" required placeholder="00000-000" inputMode="numeric"
              {...field('zipCode')} error={errors['address.zipCode']} />
          </div>
        </Section>

        <Section title="Itens">
          <ItemsEditor items={items} onChange={setItems} errors={errors} />
        </Section>

        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-slate-500">Total do pedido</p>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(total)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>Cancelar</Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Criando…' : 'Criar pedido'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}
