import { describe, expect, it } from 'vitest'
import { itemSubtotal, newItem, parsePrice } from './orderDraft'

describe('parsePrice', () => {
  it.each([
    ['49,90', 49.9],
    ['49.90', 49.9],
    ['1.234,56', 1234.56],
    [' 8 ', 8],
  ])('converte "%s" em %s', (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })

  it('retorna NaN para vazio ou texto inválido', () => {
    expect(parsePrice('')).toBeNaN()
    expect(parsePrice('abc')).toBeNaN()
  })
})

describe('itemSubtotal', () => {
  it('multiplica quantidade pelo preço', () => {
    expect(itemSubtotal({ ...newItem(), quantity: '3', unitPrice: '12,50' })).toBe(37.5)
  })

  it('considera zero enquanto o preço não foi preenchido', () => {
    expect(itemSubtotal({ ...newItem(), quantity: '2', unitPrice: '' })).toBe(0)
  })
})

describe('newItem', () => {
  it('gera chaves únicas para cada linha', () => {
    expect(newItem().key).not.toBe(newItem().key)
  })
})
