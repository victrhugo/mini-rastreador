import { describe, expect, it } from 'vitest'
import { suggestEmail } from './email'

describe('suggestEmail', () => {
  it.each([
    ['ana@gmial.com', 'ana@gmail.com'],
    ['ana@gmail.co', 'ana@gmail.com'],
    ['ana@hotmial.com', 'ana@hotmail.com'],
    ['ana@outlok.com', 'ana@outlook.com'],
    ['ana@yaho.com.br', 'ana@yahoo.com.br'],
    ['ana@empresa.con', 'ana@empresa.com'],
  ])('sugere a correção de %s', (typed, expected) => {
    expect(suggestEmail(typed)).toBe(expected)
  })

  it.each(['ana@gmail.com', 'ana@uol.com.br', 'ana@minhaempresa.com.br', 'ana@', 'ana', 'ana@gm'])(
    'não sugere nada para %s',
    (typed) => {
      expect(suggestEmail(typed)).toBeNull()
    },
  )
})
