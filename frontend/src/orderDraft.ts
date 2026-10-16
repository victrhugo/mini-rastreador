/** Linha de item enquanto o usuário edita o formulário (valores ainda como texto). */
export interface ItemDraft {
  key: string
  description: string
  quantity: string
  unitPrice: string
}

export const newItem = (): ItemDraft => ({
  key: crypto.randomUUID(),
  description: '',
  quantity: '1',
  unitPrice: '',
})

/** Converte "49,90", "1.234,56" ou "49.90" em número; NaN se inválido. */
export function parsePrice(value: string) {
  const raw = value.trim()
  // Com vírgula, o ponto é separador de milhar ("1.234,56"); sem vírgula, é decimal ("49.90").
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  return normalized === '' ? NaN : Number(normalized)
}

export function itemSubtotal(item: ItemDraft) {
  const quantity = Number(item.quantity)
  const price = parsePrice(item.unitPrice)
  return Number.isFinite(quantity) && Number.isFinite(price) ? quantity * price : 0
}
