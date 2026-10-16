import { describe, expect, it } from 'vitest'
import { formatElapsed, formatMinutes, stageTiming } from './sla'

const STARTED = '2026-10-16T12:00:00Z'
const at = (minutes: number) => new Date(STARTED).getTime() + minutes * 60_000

describe('stageTiming', () => {
  const order = { stageStartedAt: STARTED, stageDeadline: '2026-10-16T12:30:00Z' }

  it('conta o tempo na etapa e ainda não atrasou', () => {
    expect(stageTiming(order, at(12))).toEqual({ elapsed: 12, limit: 30, delayed: false, late: 0 })
  })

  it('marca atraso depois do prazo', () => {
    expect(stageTiming(order, at(37))).toEqual({ elapsed: 37, limit: 30, delayed: true, late: 7 })
  })

  it('etapas sem prazo nunca atrasam', () => {
    const timing = stageTiming({ stageStartedAt: STARTED, stageDeadline: null }, at(500))
    expect(timing.delayed).toBe(false)
    expect(timing.limit).toBeNull()
  })
})

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1 h'],
    [65, '1 h 5 min'],
  ])('%i -> %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected)
  })
})

describe('formatElapsed', () => {
  it('evita "0 min" em textos corridos', () => {
    expect(formatElapsed(0)).toBe('menos de 1 min')
    expect(formatElapsed(3)).toBe('3 min')
  })
})
