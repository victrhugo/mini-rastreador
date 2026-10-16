import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { setAuthToken, setUnauthorizedHandler } from '../api/client'
import type { AuthResponse, User } from '../types'
import { clearSession, loadSession, saveSession } from './session'

interface AuthContextValue {
  user: User | null
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

  const start = useCallback((next: AuthResponse) => {
    saveSession(next)
    setAuthToken(next.token)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setAuthToken(null)
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      login: async (email, password) => start(await authApi.login(email, password)),
      register: async (name, email, password) => start(await authApi.register(name, email, password)),
      logout,
    }),
    [session, start, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return context
}
