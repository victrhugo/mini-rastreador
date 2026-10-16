import { formatDateTime, formatRelative } from '../format'
import { STATUS } from '../status'
import type { StatusChange } from '../types'

/** Histórico de mudanças, mais recente primeiro. */
export function StatusTimeline({ history }: { history: StatusChange[] }) {
  const entries = [...history].reverse()

  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => {
        const { Icon, label } = STATUS[entry.to]
        const last = index === entries.length - 1
        return (
          <li key={`${entry.to}-${entry.changedAt}`} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute top-8 bottom-0 left-[13px] w-px bg-line" aria-hidden="true" />}
            <span className={`st-${entry.to} st-soft relative flex size-7 shrink-0 items-center justify-center rounded-full`}>
              <Icon className="size-3.5" weight="bold" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-ink">{entry.from ? label : 'Pedido recebido'}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                <time dateTime={entry.changedAt} title={formatDateTime(entry.changedAt)}>
                  {formatRelative(entry.changedAt)}
                </time>{' '}
                por {entry.changedBy}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
