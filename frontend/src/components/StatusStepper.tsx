import { motion, useReducedMotion } from 'motion/react'
import { formatTime } from '../format'
import { DELIVERY_STEPS, reachedStep, STATUS } from '../status'
import type { OrderStatus, StatusChange } from '../types'

interface Props {
  status: OrderStatus
  history?: StatusChange[]
}

/**
 * Rastreio em etapas: ícone por etapa, conectores que se preenchem e horário
 * em que cada etapa foi alcançada.
 */
export function StatusStepper({ status, history = [] }: Props) {
  const reduceMotion = useReducedMotion()
  const cancelled = status === 'CANCELADO'
  const reached = reachedStep(status, history)
  const tone = cancelled ? 'CANCELADO' : status

  return (
    <ol className={`st-${tone} grid grid-cols-4`}>
      {DELIVERY_STEPS.map((step, index) => {
        const { label, Icon } = STATUS[step]
        const done = index < reached || (index === reached && status === 'ENTREGUE')
        const current = index === reached && !done
        const active = index <= reached
        const at = history.find((entry) => entry.to === step)?.changedAt

        return (
          <li key={step} className="relative flex flex-col gap-2.5" aria-current={current ? 'step' : undefined}>
            <div className="flex items-center">
              <span className="relative flex size-9 shrink-0 items-center justify-center">
                {current && !cancelled && !reduceMotion && (
                  <motion.span
                    className="st-fill absolute inset-0 rounded-full"
                    initial={{ opacity: 0.35, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.7 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <span
                  className={`relative flex size-9 items-center justify-center rounded-full transition-colors duration-300 ${
                    active
                      ? cancelled
                        ? 'bg-surface-2 text-ink-3 ring-1 ring-line-strong'
                        : 'st-fill text-surface'
                      : 'bg-surface text-ink-3 ring-1 ring-line-strong'
                  }`}
                >
                  <Icon className="size-[18px]" weight={active ? 'fill' : 'regular'} />
                </span>
              </span>
              {index < DELIVERY_STEPS.length - 1 && (
                <span className="mx-2 h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                  <motion.span
                    className={`block h-full origin-left rounded-full ${cancelled ? 'bg-line-strong' : 'st-fill'}`}
                    initial={false}
                    animate={{ scaleX: index < reached ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              )}
            </div>
            <div className="pr-2">
              <p className={`text-[13px] leading-tight ${current ? 'font-semibold text-ink' : active ? 'font-medium text-ink-2' : 'text-ink-3'}`}>
                {label}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums">{at ? formatTime(at) : '--:--'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
