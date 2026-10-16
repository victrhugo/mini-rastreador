import { useEffect, useState } from 'react'
import { formatRelative } from '../format'

/** Mostra que a tela se atualiza sozinha e quando foi a última atualização. */
export function LiveIndicator({ updatedAt, fetching }: { updatedAt: number; fetching: boolean }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-500">
      <span className="relative flex size-2">
        <span className={`absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 ${fetching ? 'animate-ping' : ''}`} />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Ao vivo · atualizado {formatRelative(new Date(updatedAt).toISOString(), now)}
    </span>
  )
}
