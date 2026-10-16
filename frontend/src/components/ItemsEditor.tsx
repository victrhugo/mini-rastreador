import { formatMoney } from '../format'
import { itemSubtotal, newItem, type ItemDraft } from '../orderDraft'
import { Button, Field } from './ui'

interface Props {
  items: ItemDraft[]
  onChange: (items: ItemDraft[]) => void
  errors: Record<string, string>
}

export function ItemsEditor({ items, onChange, errors }: Props) {
  const update = (key: string, patch: Partial<ItemDraft>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.key} className="grid grid-cols-12 items-start gap-3">
          <Field
            className="col-span-12 sm:col-span-6"
            label={index === 0 ? 'Descrição' : ''}
            aria-label={`Descrição do item ${index + 1}`}
            placeholder="Ex.: Pizza calabresa"
            required
            value={item.description}
            onChange={(e) => update(item.key, { description: e.target.value })}
            error={errors[`items[${index}].description`]}
          />
          <Field
            className="col-span-4 sm:col-span-2"
            label={index === 0 ? 'Qtd.' : ''}
            aria-label={`Quantidade do item ${index + 1}`}
            type="number"
            min={1}
            max={999}
            required
            value={item.quantity}
            onChange={(e) => update(item.key, { quantity: e.target.value })}
            error={errors[`items[${index}].quantity`]}
          />
          <Field
            className="col-span-5 sm:col-span-2"
            label={index === 0 ? 'Preço (R$)' : ''}
            aria-label={`Preço unitário do item ${index + 1}`}
            inputMode="decimal"
            placeholder="0,00"
            required
            value={item.unitPrice}
            onChange={(e) => update(item.key, { unitPrice: e.target.value })}
            error={errors[`items[${index}].unitPrice`]}
          />
          <div className={`col-span-3 flex items-center justify-end gap-2 sm:col-span-2 ${index === 0 ? 'sm:pt-6' : ''}`}>
            <span className="py-2 text-sm tabular-nums text-slate-600">{formatMoney(itemSubtotal(item))}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((other) => other.key !== item.key))}
              disabled={items.length === 1}
              className="rounded-md px-2 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:invisible"
              aria-label={`Remover item ${index + 1}`}
              title="Remover item"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...items, newItem()])}>
        + Adicionar item
      </Button>
    </div>
  )
}
