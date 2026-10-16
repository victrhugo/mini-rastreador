import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './ui'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Diálogo de confirmação sobre o <dialog> nativo (foco, Esc e top layer de graça). */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Voltar', loading, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-pop"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-1.5 text-sm text-ink-2">{children}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
        <Button
          variant="destructive"
          loading={loading}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
