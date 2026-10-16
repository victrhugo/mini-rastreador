import { EnvelopeSimpleIcon, UserIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Field } from '../components/ui'
import { AuthLayout } from './AuthLayout'
import { PasswordField } from './LoginPage'

export function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors(({ [field]: _removed, ...rest }) => rest)
  }

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
        setFieldErrors(err.fieldErrors)
        if (Object.keys(err.fieldErrors).length === 0) setError(err.message)
      } else {
        setError('Erro inesperado ao cadastrar.')
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto. Depois é só cadastrar os pedidos."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">Entrar</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field
          label="Nome"
          name="name"
          autoComplete="name"
          placeholder="Como você quer ser chamado"
          autoFocus
          icon={<UserIcon className="size-4" />}
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          error={fieldErrors.name}
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          icon={<EnvelopeSimpleIcon className="size-4" />}
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          error={fieldErrors.email}
        />
        <PasswordField
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
          error={fieldErrors.password}
          hint="Mínimo de 6 caracteres."
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Criando conta' : 'Criar conta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
