import { useSyncExternalStore } from 'react'

/** Estado da conexão em tempo real com a API, compartilhado entre as telas. */
export type LiveStatus = 'connecting' | 'live' | 'offline'

let status: LiveStatus = 'connecting'
const listeners = new Set<() => void>()

export function setLiveStatus(next: LiveStatus) {
  if (next === status) return
  status = next
  listeners.forEach((listener) => listener())
}

export function useLiveStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
  )
}
