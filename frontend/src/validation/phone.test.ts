import { describe, expect, it } from 'vitest'
import { phoneProblem } from './phone'

describe('phoneProblem', () => {
  it.each(['(11) 98765-4321', '(21) 3333-4444', ''])('aceita "%s"', (phone) => {
    expect(phoneProblem(phone)).toBeNull()
  })

  it.each([
    ['(20) 98765-4321', 'DDD 20 não existe'],
    ['(11) 88765-4321', 'Celular deve começar com 9 depois do DDD'],
    ['(11) 9333-4444', 'Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD'],
    ['(11) 9876', 'Telefone deve ter DDD e 8 ou 9 dígitos'],
  ])('explica o problema de "%s"', (phone, expected) => {
    expect(phoneProblem(phone)).toBe(expected)
  })
})
