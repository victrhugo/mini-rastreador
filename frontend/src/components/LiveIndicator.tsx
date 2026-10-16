import { useNow } from '../hooks/useNow'
import { formatRelative } from '../format'

/**
 * Mostra se a tela está recebendo atualizações em tempo real. Sem a conexão,
 * indica há quanto tempo os dados foram atualizados pela consulta de reserva.
 */
export function LiveIndicator({ updatedAt, fetching, live }: { updatedAt: number; fetching: boolean; live: boolean }) {
  const now = useNow(5_000)

  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-3">
      <span className="relative flex size-2">
        {live && (
          <span className={`absolute inline-flex size-full rounded-full bg-success opacity-60 ${fetching ? 'motion-safe:animate-ping' : ''}`} />
        )}
        <span className={`relative inline-flex size-2 rounded-full ${live ? 'bg-success' : 'bg-line-strong'}`} />
      </span>
      {live
        ? 'Tempo real'
        : `Reconectando, atualizado ${formatRelative(new Date(updatedAt).toISOString(), now)}`}
    </span>
  )
}
