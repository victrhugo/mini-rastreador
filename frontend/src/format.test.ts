import { describe, expect, it } from 'vitest'
import { formatMoney, initials, maskPhone, maskZipCode } from './format'

describe('maskZipCode', () => {
  it('formata o CEP enquanto o usuário digita', () => {
    expect(maskZipCode('0131')).toBe('0131')
    expect(maskZipCode('01310100')).toBe('01310-100')
  })

  it('ignora letras e limita a 8 dígitos', () => {
    expect(maskZipCode('01a310-1009999')).toBe('01310-100')
  })
})

describe('maskPhone', () => {
  it('formata celular com 9 dígitos', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formata telefone fixo com 8 dígitos', () => {
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('formata parcialmente durante a digitação', () => {
    expect(maskPhone('1')).toBe('(1')
    expect(maskPhone('119')).toBe('(11) 9')
    expect(maskPhone('')).toBe('')
  })
})

describe('formatMoney', () => {
  it('usa o formato brasileiro', () => {
    expect(formatMoney(1234.5)).toMatch(/^R\$\s1\.234,50$/)
  })
})

describe('initials', () => {
  it('usa a primeira e a última inicial', () => {
    expect(initials('Mariana Costa Lima')).toBe('ML')
    expect(initials('Ana')).toBe('A')
  })
})
