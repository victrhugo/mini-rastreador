import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthContext'
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'

// Cada página vira um arquivo separado no build e só é baixada quando acessada.
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const NewOrderPage = lazy(() => import('./pages/NewOrderPage').then((m) => ({ default: m.NewOrderPage })))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })))
const TrackingPage = lazy(() => import('./pages/TrackingPage').then((m) => ({ default: m.TrackingPage })))

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Suspense fallback={<div className="min-h-[100dvh]" aria-busy="true" />}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>
          </Route>
          {/* Página pública do cliente: acessível com ou sem login. */}
          <Route path="/rastreio/:code" element={<TrackingPage />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
    </ErrorBoundary>
  )
}
