import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Field } from '../components/ui'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      // Com o usuário definido, o GuestRoute redireciona para os pedidos.
      await register(form.name, form.email, form.password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors)
      } else {
        setError('Erro inesperado ao cadastrar.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para acessar o rastreador">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label="Nome" autoComplete="name" required autoFocus
          value={form.name} onChange={update('name')} error={fieldErrors.name} />
        <Field label="E-mail" type="email" autoComplete="email" required
          value={form.email} onChange={update('email')} error={fieldErrors.email} />
        <Field label="Senha" type="password" autoComplete="new-password" required minLength={6}
          placeholder="Mínimo de 6 caracteres"
          value={form.password} onChange={update('password')} error={fieldErrors.password} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Cadastrando…' : 'Cadastrar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-orange-700 hover:underline">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
