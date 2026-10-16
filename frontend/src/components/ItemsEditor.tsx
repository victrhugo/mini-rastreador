import { MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { formatMoney } from '../format'
import { itemSubtotal, newItem, type ItemDraft } from '../orderDraft'
import { Field } from './ui'

interface Props {
  items: ItemDraft[]
  onChange: (items: ItemDraft[]) => void
  errorFor: (field: string) => string | undefined
}

export function ItemsEditor({ items, onChange, errorFor }: Props) {
  const update = (key: string, patch: Partial<ItemDraft>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))

  const step = (item: ItemDraft, delta: number) => {
    const current = Number(item.quantity) || 0
    update(item.key, { quantity: String(Math.min(999, Math.max(1, current + delta))) })
  }

  return (
    <div>
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.li
              key={item.key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-line bg-surface-2/40 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-3">Item {index + 1}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium tabular-nums">{formatMoney(itemSubtotal(item))}</span>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((other) => other.key !== item.key))}
                    disabled={items.length === 1}
                    className="-mr-1 flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger disabled:hidden"
                    aria-label={`Remover item ${index + 1}`}
                    title="Remover item"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_124px_136px]">
                <Field
                  className="col-span-2 sm:col-span-1"
                  label="Descrição"
                  name={`items[${index}].description`}
                  placeholder="Ex.: Pizza calabresa grande"
                  value={item.description}
                  onChange={(e) => update(item.key, { description: e.target.value })}
                  error={errorFor(`items[${index}].description`)}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`items[${index}].quantity`} className="text-[13px] font-medium text-ink-2">Qtd.</label>
                  <div className="flex h-10 items-center rounded-lg border border-line-strong bg-surface focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                    <button
                      type="button"
                      onClick={() => step(item, -1)}
                      disabled={Number(item.quantity) <= 1}
                      className="flex h-full w-9 items-center justify-center text-ink-2 hover:text-ink disabled:opacity-40"
                      aria-label={`Diminuir quantidade do item ${index + 1}`}
                    >
                      <MinusIcon className="size-3.5" weight="bold" />
                    </button>
                    <input
                      id={`items[${index}].quantity`}
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) => update(item.key, { quantity: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                      className="h-full w-full min-w-0 bg-transparent text-center text-sm font-medium tabular-nums outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => step(item, 1)}
                      className="flex h-full w-9 items-center justify-center text-ink-2 hover:text-ink"
                      aria-label={`Aumentar quantidade do item ${index + 1}`}
                    >
                      <PlusIcon className="size-3.5" weight="bold" />
                    </button>
                  </div>
                  {errorFor(`items[${index}].quantity`) && (
                    <p className="text-xs text-danger">{errorFor(`items[${index}].quantity`)}</p>
                  )}
                </div>
                <Field
                  label="Preço unit."
                  name={`items[${index}].unitPrice`}
                  prefix="R$"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={item.unitPrice}
                  onChange={(e) => update(item.key, { unitPrice: e.target.value.replace(/[^\d.,]/g, '') })}
                  error={errorFor(`items[${index}].unitPrice`)}
                />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
      >
        <PlusIcon className="size-4" weight="bold" />
        Adicionar item
      </button>
    </div>
  )
}
