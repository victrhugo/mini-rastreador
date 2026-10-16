import { useEffect, useState } from 'react'

/** Relógio que atualiza a cada intervalo, para textos como "há 5 min" e alertas de atraso. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
