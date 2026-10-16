import { AnimatePresence, motion } from 'motion/react'
import { STATUS } from '../status'
import type { OrderStatus } from '../types'

export function StatusBadge({ status, size = 'md' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const { label, Icon } = STATUS[status]
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`st-${status} st-badge inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${
          size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-[13px]'
        }`}
      >
        <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} weight="bold" />
        {label}
      </motion.span>
    </AnimatePresence>
  )
}
