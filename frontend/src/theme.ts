import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'rastreador.theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

let preference = readPreference()

function apply() {
  const dark = preference === 'dark' || (preference === 'system' && darkQuery().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

// Com "sistema", acompanha a troca de tema do sistema operacional em tempo real.
darkQuery().addEventListener('change', () => preference === 'system' && apply())

function setPreference(next: ThemePreference) {
  preference = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Sem armazenamento: vale só para esta aba.
  }
  apply()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Preferência de tema compartilhada entre todos os componentes que a usam. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => preference)
  return { preference: current, setPreference }
}
