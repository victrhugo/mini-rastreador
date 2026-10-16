import { ArrowClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui'

const RELOAD_KEY = 'rastreador.chunkReloadAt'

/** Erro ao baixar o arquivo de uma página (comum depois de um novo deploy). */
function isChunkLoadError(error: Error) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(
    error.message,
  )
}

/**
 * Evita tela em branco: mostra uma mensagem com botão de recarregar. Se o erro for
 * de arquivo de página desatualizado (deploy novo), recarrega sozinho uma vez.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na interface', error, info.componentStack)

    if (isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
          window.location.reload()
        }
      } catch {
        // sem sessionStorage: fica a mensagem com o botão
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div role="alert" className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center shadow-card">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <WarningCircleIcon className="size-6" weight="bold" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">Algo deu errado</h1>
          <p className="mt-1 text-sm text-ink-2">Recarregue a página para continuar. Seus pedidos estão salvos.</p>
          <Button className="mt-5 w-full" icon={<ArrowClockwiseIcon className="size-4" weight="bold" />} onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    )
  }
}
