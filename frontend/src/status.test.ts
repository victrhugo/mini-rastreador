import { describe, expect, it } from 'vitest'
import { isFinalStatus, nextStep, reachedStep } from './status'
import type { StatusChange } from './types'

const change = (from: StatusChange['from'], to: StatusChange['to']): StatusChange => ({
  from,
  to,
  changedBy: 'Operador',
  changedAt: '2026-10-16T12:00:00Z',
})

describe('nextStep', () => {
  it('escolhe a próxima etapa e ignora o cancelamento', () => {
    expect(nextStep(['EM_PREPARO', 'CANCELADO'])).toBe('EM_PREPARO')
    expect(nextStep(['CANCELADO'])).toBeUndefined()
    expect(nextStep([])).toBeUndefined()
  })
})

describe('reachedStep', () => {
  it('usa a posição do status no fluxo', () => {
    expect(reachedStep('RECEBIDO')).toBe(0)
    expect(reachedStep('SAIU_PARA_ENTREGA')).toBe(2)
    expect(reachedStep('ENTREGUE')).toBe(3)
  })

  it('para cancelados, usa a etapa em que o pedido parou', () => {
    const history = [change(null, 'RECEBIDO'), change('RECEBIDO', 'EM_PREPARO'), change('EM_PREPARO', 'CANCELADO')]
    expect(reachedStep('CANCELADO', history)).toBe(1)
  })
})

describe('isFinalStatus', () => {
  it('só entregue e cancelado são finais', () => {
    expect(isFinalStatus('ENTREGUE')).toBe(true)
    expect(isFinalStatus('CANCELADO')).toBe(true)
    expect(isFinalStatus('SAIU_PARA_ENTREGA')).toBe(false)
  })
})
