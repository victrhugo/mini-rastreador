import { ArrowSquareOutIcon, CopyIcon, LinkSimpleIcon } from '@phosphor-icons/react'
import { trackingUrl } from '../api/tracking'
import { useToast } from './Toast'
import { buttonClass } from './ui'

/** Link público para o cliente acompanhar o pedido, com atalho para copiar. */
export function TrackingLink({ code }: { code: string }) {
  const toast = useToast()
  const url = trackingUrl(code)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link de rastreio copiado')
    } catch {
      toast('Não foi possível copiar. Selecione o link e copie manualmente.', 'error')
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-2">Envie para o cliente acompanhar o pedido sem precisar de login.</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2">
        <LinkSimpleIcon className="size-4 shrink-0 text-ink-3" />
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Link de rastreio"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-ink-2 outline-none"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className={buttonClass('secondary', 'sm')}>
          <CopyIcon className="size-4" />
          Copiar link
        </button>
        <a href={url} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
          Abrir
          <ArrowSquareOutIcon className="size-3.5" />
        </a>
      </div>
    </div>
  )
}
