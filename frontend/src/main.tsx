import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { ApiError } from './api/client'
import { ToastProvider } from './components/Toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    // Erros 4xx (404, 401, 409...) não melhoram com nova tentativa; só rede e 5xx tentam de novo.
    queries: {
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user": respeita prefers-reduced-motion em todas as animações do Motion. */}
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
)
