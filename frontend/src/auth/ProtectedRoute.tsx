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

/** Telas de login/cadastro: quem já está logado vai direto para os pedidos. */
export function GuestRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/orders" replace /> : <Outlet />
}
