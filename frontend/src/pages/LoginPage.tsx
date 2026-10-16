import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Field } from '../components/ui'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: string } | null)?.from ?? '/orders'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado ao entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Mini Rastreador" subtitle="Entre para acompanhar os pedidos">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="E-mail" type="email" autoComplete="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Senha" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Não tem conta?{' '}
        <Link to="/register" className="font-medium text-orange-700 hover:underline">Cadastre-se</Link>
      </p>
    </AuthLayout>
  )
}
