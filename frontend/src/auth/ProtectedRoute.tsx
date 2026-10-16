import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

/**
 * Redireciona para o login quando não há usuário autenticado. A página atual só é
 * lembrada se a sessão expirou: depois de sair pelo botão, o próximo login (talvez de
 * outra pessoa) começa na lista de pedidos.
 */
export function ProtectedRoute() {
  const { user, logoutReason } = useAuth()
  const location = useLocation()

  if (!user) {
    const from = logoutReason === 'manual' ? undefined : location.pathname + location.search
    return <Navigate to="/login" replace state={from ? { from } : undefined} />
  }
  return <Outlet />
}

/** Aceita só caminhos internos do app (evita redirecionar para outro site). */
function safeRedirect(from: unknown) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/orders'
}

/**
 * Telas de login/cadastro. Assim que há usuário (inclusive logo após entrar),
 * volta para a página que pediu login, ou para a lista de pedidos.
 */
export function GuestRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    return <Navigate to={safeRedirect((location.state as { from?: unknown } | null)?.from)} replace />
  }
  return <Outlet />
}
