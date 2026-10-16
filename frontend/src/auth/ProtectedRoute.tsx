import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

/** Redireciona para o login quando não há usuário autenticado. */
export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/**
 * Telas de login/cadastro. Assim que há usuário (inclusive logo após entrar),
 * volta para a página que pediu login, ou para a lista de pedidos.
 */
export function GuestRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/orders'
    return <Navigate to={from} replace />
  }
  return <Outlet />
}
