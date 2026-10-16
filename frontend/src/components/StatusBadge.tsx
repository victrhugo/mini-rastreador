import { STATUS } from '../status'
import type { OrderStatus } from '../types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
