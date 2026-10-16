import { MapPinIcon } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Logo } from '../components/Logo'
import { StatusBadge } from '../components/StatusBadge'
import { StatusStepper } from '../components/StatusStepper'
import { ThemeToggle } from '../components/ThemeToggle'
import { DELIVERY_STEPS } from '../status'
import type { StatusChange } from '../types'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12"
        >
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-ink-2">{footer}</p>
        </motion.div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-surface-2 lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div className="relative max-w-[520px]">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-[44px]">
            Cada pedido, da cozinha até a porta.
          </h2>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink-2">
            Cadastre pedidos, avance as etapas e acompanhe as entregas em tempo real.
          </p>
          <TrackingPreview />
        </div>
      </aside>
    </div>
  )
}

const PREVIEW_START = Date.now() - 18 * 60_000

/** Prévia ilustrativa do rastreio, percorrendo as etapas em loop. */
function TrackingPreview() {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(2)

  useEffect(() => {
    if (reduceMotion) return
    const timer = setInterval(() => setStep((current) => (current + 1) % DELIVERY_STEPS.length), 2400)
    return () => clearInterval(timer)
  }, [reduceMotion])

  const status = DELIVERY_STEPS[step]
  const history: StatusChange[] = DELIVERY_STEPS.slice(0, step + 1).map((to, index) => ({
    from: index === 0 ? null : DELIVERY_STEPS[index - 1],
    to,
    changedBy: 'Equipe',
    changedAt: new Date(PREVIEW_START + index * 7 * 60_000).toISOString(),
  }))

  return (
    <div aria-hidden="true" className="mt-10 rounded-xl border border-line bg-surface p-5 shadow-pop">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-3">#1042</p>
          <p className="mt-0.5 font-semibold">Mariana Costa</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-2">
            <MapPinIcon className="size-3.5" weight="bold" />
            Rua Oscar Freire, 820, Jardins
          </p>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="mt-6">
        <StatusStepper status={status} history={history} />
      </div>
    </div>
  )
}
