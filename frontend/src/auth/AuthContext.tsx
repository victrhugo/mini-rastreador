import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { setAuthToken, setUnauthorizedHandler } from '../api/client'
import type { AuthResponse, User } from '../types'
import { clearSession, loadSession, saveSession, SESSION_KEY } from './session'

/** Por que não há sessão: saída pelo botão ou sessão expirada/recusada pela API. */
export type LogoutReason = 'manual' | 'expired' | null

interface AuthContextValue {
  user: User | null
  logoutReason: LogoutReason
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AuthResponse | null>(() => {
    const saved = loadSession()
    setAuthToken(saved?.token ?? null)
    return saved
  })

  const [logoutReason, setLogoutReason] = useState<LogoutReason>(null)

  const start = useCallback((next: AuthResponse) => {
    saveSession(next)
    setAuthToken(next.token)
    setSession(next)
    setLogoutReason(null)
  }, [])

  const end = useCallback(
    (reason: Exclude<LogoutReason, null>) => {
      clearSession()
      setAuthToken(null)
      setSession(null)
      setLogoutReason(reason)
      queryClient.clear()
    },
    [queryClient],
  )

  const logout = useCallback(() => end('manual'), [end])

  useEffect(() => {
    setUnauthorizedHandler(() => end('expired'))
  }, [end])

  // Mantém as abas em sincronia: sair (ou entrar) em uma aba vale para as outras.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY) return
      const next = loadSession()
      setAuthToken(next?.token ?? null)
      setSession(next)
      if (!next) {
        setLogoutReason('manual')
        queryClient.clear()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      logoutReason,
      login: async (email, password) => start(await authApi.login(email, password)),
      register: async (name, email, password) => start(await authApi.register(name, email, password)),
      logout,
    }),
    [session, logoutReason, start, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return context
}
