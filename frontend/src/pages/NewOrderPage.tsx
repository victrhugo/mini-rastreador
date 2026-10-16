import { ArrowLeftIcon, MapPinIcon, PhoneIcon, ReceiptIcon, UserIcon, type Icon } from '@phosphor-icons/react'
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useCreateOrder } from '../api/orders'
import { ItemsEditor } from '../components/ItemsEditor'
import { useToast } from '../components/Toast'
import { Alert, Button, Card, Field } from '../components/ui'
import { formatMoney, maskPhone, maskZipCode } from '../format'
import { itemSubtotal, newItem, parsePrice, type ItemDraft } from '../orderDraft'
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

/** Campo do formulário -> caminho do erro na resposta da API. */
const API_FIELD: Record<keyof FormState, string> = {
  customerName: 'customer.name',
  customerPhone: 'customer.phone',
  street: 'address.street',
  number: 'address.number',
  complement: 'address.complement',
  district: 'address.district',
  city: 'address.city',
  zipCode: 'address.zipCode',
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createOrder = useCreateOrder()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [items, setItems] = useState<ItemDraft[]>(() => [newItem()])
  // Campos editados depois do último envio: o erro antigo deixa de aparecer neles.
  const [edited, setEdited] = useState<Set<string>>(new Set())

  const apiError = createOrder.error instanceof ApiError ? createOrder.error : null
  const errorFor = (path: string) => (edited.has(path) ? undefined : apiError?.fieldErrors[path])
  const markEdited = (path: string) => setEdited((prev) => (prev.has(path) ? prev : new Set(prev).add(path)))

  const total = items.reduce((sum, item) => sum + itemSubtotal(item), 0)
  const filledItems = items.filter((item) => item.description.trim())

  const field = (name: keyof FormState, mask?: (value: string) => string) => ({
    name: API_FIELD[name],
    value: form[name],
    error: errorFor(API_FIELD[name]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const value = mask ? mask(e.target.value) : e.target.value
      setForm((prev) => ({ ...prev, [name]: value }))
      markEdited(API_FIELD[name])
    },
  })

  const ITEM_FIELDS = ['description', 'quantity', 'unitPrice'] as const

  const changeItems = (next: ItemDraft[]) => {
    next.forEach((item, index) => {
      const before = items[index]
      // Linha nova ou deslocada (item removido acima): o erro antigo não vale mais para ela.
      const shifted = !before || before.key !== item.key
      ITEM_FIELDS.forEach((key) => {
        if (shifted || before[key] !== item[key]) markEdited(`items[${index}].${key}`)
      })
    })
    setItems(next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEdited(new Set())
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
      onSuccess: (order) => {
        toast(`Pedido #${order.id} criado`)
        navigate(`/orders/${order.id}`, { replace: true })
      },
    })
  }

  const fieldErrorCount = apiError ? Object.keys(apiError.fieldErrors).length : 0

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <header>
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink">
          <ArrowLeftIcon className="size-4" />
          Pedidos
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">Novo pedido</h1>
        <p className="mt-1 text-sm text-ink-2">O pedido entra como recebido e aparece na lista na hora.</p>
      </header>

      {createOrder.isError && (
        <Alert>
          {fieldErrorCount > 0
            ? `Revise ${fieldErrorCount === 1 ? 'o campo destacado' : `os ${fieldErrorCount} campos destacados`}.`
            : createOrder.error.message}
          {apiError?.fieldErrors.items && ` ${apiError.fieldErrors.items}`}
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Section Icon={UserIcon} title="Cliente" description="Quem vai receber o pedido.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" placeholder="Nome completo" autoComplete="off" autoFocus {...field('customerName')} />
              <Field
                label="Telefone"
                optional
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-0000"
                icon={<PhoneIcon className="size-4" />}
                {...field('customerPhone', maskPhone)}
              />
            </div>
          </Section>

          <Section Icon={MapPinIcon} title="Endereço de entrega">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field className="sm:col-span-2" label="CEP" placeholder="00000-000" inputMode="numeric" {...field('zipCode', maskZipCode)} />
              <Field className="sm:col-span-4" label="Rua" placeholder="Rua, avenida, alameda" {...field('street')} />
              <Field className="sm:col-span-2" label="Número" placeholder="123" {...field('number')} />
              <Field className="sm:col-span-4" label="Complemento" optional placeholder="Apto, bloco, referência" {...field('complement')} />
              <Field className="sm:col-span-3" label="Bairro" {...field('district')} />
              <Field className="sm:col-span-3" label="Cidade" {...field('city')} />
            </div>
          </Section>

          <Section Icon={ReceiptIcon} title="Itens">
            <ItemsEditor items={items} onChange={changeItems} errorFor={errorFor} />
          </Section>
        </div>

        <aside className="lg:sticky lg:top-10">
          <Card className="overflow-hidden">
            <div className="border-b border-line p-5">
              <h2 className="text-[15px] font-semibold">Resumo</h2>
              <p className="mt-1 truncate text-sm text-ink-2">
                {form.customerName.trim() || 'Cliente não informado'}
              </p>
              {form.street.trim() && (
                <p className="truncate text-xs text-ink-3">
                  {form.street}{form.number && `, ${form.number}`}{form.district && `, ${form.district}`}
                </p>
              )}
            </div>
            <div className="p-5">
              {filledItems.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {filledItems.map((item) => (
                    <li key={item.key} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-ink-2">
                        <span className="font-mono text-xs text-ink-3">{Number(item.quantity) || 0}x</span> {item.description}
                      </span>
                      <span className="tabular-nums">{formatMoney(itemSubtotal(item))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-3">Os itens adicionados aparecem aqui.</p>
              )}
              <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line-strong pt-4">
                <span className="text-sm text-ink-2">Total</span>
                <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(total)}</span>
              </div>
              <Button type="submit" size="lg" className="mt-5 w-full" loading={createOrder.isPending}>
                {createOrder.isPending ? 'Criando pedido' : 'Criar pedido'}
              </Button>
              <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => navigate('/orders')}>
                Descartar
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </form>
  )
}

function Section({ Icon, title, description, children }: {
  Icon: Icon
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="size-4" weight="bold" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold leading-8">{title}</h2>
          {description && <p className="-mt-1 text-sm text-ink-2">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  )
}
