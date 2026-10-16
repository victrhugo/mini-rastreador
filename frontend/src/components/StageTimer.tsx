import { ClockIcon, WarningIcon } from '@phosphor-icons/react'
import { useNow } from '../hooks/useNow'
import { formatElapsed, formatMinutes, stageTiming } from '../sla'
import type { Order } from '../types'

/** "12 min nesta etapa" ou, depois do prazo, "Atrasado 7 min". Nada para etapas finais. */
export function StageTimer({ order }: { order: Order }) {
  const now = useNow()
  const timing = stageTiming(order, now)
  if (timing.limit === null) return null

  if (timing.delayed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
        <WarningIcon className="size-3.5" weight="bold" />
        Atrasado {formatMinutes(timing.late)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-3" title={`Limite da etapa: ${formatMinutes(timing.limit)}`}>
      <ClockIcon className="size-3.5" />
      {formatElapsed(timing.elapsed)} nesta etapa
    </span>
  )
}
