import type { Order } from './types'

export interface StageTiming {
  /** Minutos desde que o pedido entrou na etapa atual. */
  elapsed: number
  /** Limite da etapa em minutos; null se a etapa não tem prazo. */
  limit: number | null
  delayed: boolean
  /** Minutos além do prazo (0 se não estiver atrasado). */
  late: number
}

const minutesBetween = (from: number, to: number) => Math.max(0, Math.floor((to - from) / 60_000))

/** Tempo na etapa atual e atraso em relação ao prazo calculado pela API. */
export function stageTiming(order: Pick<Order, 'stageStartedAt' | 'stageDeadline'>, now = Date.now()): StageTiming {
  const started = new Date(order.stageStartedAt).getTime()
  const deadline = order.stageDeadline ? new Date(order.stageDeadline).getTime() : null

  return {
    elapsed: minutesBetween(started, now),
    limit: deadline === null ? null : minutesBetween(started, deadline),
    delayed: deadline !== null && now > deadline,
    late: deadline !== null && now > deadline ? Math.max(1, minutesBetween(deadline, now)) : 0,
  }
}

/** 7 -> "7 min", 65 -> "1 h 5 min" */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

/** Tempo decorrido para textos corridos: 0 -> "menos de 1 min". */
export function formatElapsed(minutes: number) {
  return minutes === 0 ? 'menos de 1 min' : formatMinutes(minutes)
}
