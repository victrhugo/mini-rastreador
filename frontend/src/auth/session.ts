import type { AuthResponse } from '../types'

const STORAGE_KEY = 'rastreador.session'

/** Lê a sessão salva; descarta se estiver corrompida ou expirada. */
export function loadSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthResponse
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session: AuthResponse) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Armazenamento indisponível (aba anônima, por exemplo): a sessão vale só em memória.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignora
  }
}
