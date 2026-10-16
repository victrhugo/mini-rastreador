import { formatDateTime } from '../format'
import { STATUS } from '../status'
import type { StatusChange } from '../types'

export function StatusTimeline({ history }: { history: StatusChange[] }) {
  const entries = [...history].reverse()

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {entries.map((entry, index) => (
        <li key={`${entry.to}-${entry.changedAt}`} className="relative">
          <span
            className={`absolute -left-[26.5px] top-1 size-3 rounded-full ring-4 ring-white ${
              index === 0 ? STATUS[entry.to].dot : 'bg-slate-300'
            }`}
          />
          <p className={`text-sm font-medium ${index === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
            {entry.from ? STATUS[entry.to].label : 'Pedido recebido'}
          </p>
          <p className="text-xs text-slate-500">
            {formatDateTime(entry.changedAt)} · por {entry.changedBy}
          </p>
        </li>
      ))}
    </ol>
  )
}
