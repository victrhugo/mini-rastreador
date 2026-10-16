import { EnvelopeSimpleIcon, EyeIcon, EyeSlashIcon, LockSimpleIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert, Button, Field } from '../components/ui'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { login, logoutReason } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Com o usuário definido, o GuestRoute redireciona para a página de origem.
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado ao entrar.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse o painel de pedidos com seu e-mail."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">Criar conta</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {!error && logoutReason === 'expired' && (
          <p role="status" className="rounded-lg bg-surface-2 px-3.5 py-3 text-sm text-ink-2">
            Sua sessão expirou. Entre de novo para continuar de onde parou.
          </p>
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          required
          autoFocus
          icon={<EnvelopeSimpleIcon className="size-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Entrando' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export function PasswordField({ value, onChange, autoComplete, error, hint }: {
  value: string
  onChange: (value: string) => void
  autoComplete: string
  error?: string
  hint?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      label="Senha"
      name="password"
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      required
      icon={<LockSimpleIcon className="size-4" />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="-mr-1 rounded-md p-1 text-ink-3 hover:text-ink"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      }
    />
  )
}
