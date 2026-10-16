import { useEffect, useState } from 'react'
import { formatRelative } from '../format'

/** Mostra que a tela se atualiza sozinha e quando foi a última atualização. */
export function LiveIndicator({ updatedAt, fetching }: { updatedAt: number; fetching: boolean }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-3">
      <span className="relative flex size-2">
        <span className={`absolute inline-flex size-full rounded-full bg-success opacity-60 ${fetching ? 'motion-safe:animate-ping' : ''}`} />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Ao vivo, atualizado {formatRelative(new Date(updatedAt).toISOString(), now)}
    </span>
  )
}
