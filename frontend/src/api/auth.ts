import type { AuthResponse } from '../types'
import { api } from './client'

export function login(email: string, password: string) {
  return api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } })
}

export function register(name: string, email: string, password: string) {
  return api<AuthResponse>('/api/auth/register', { method: 'POST', body: { name, email, password } })
}
