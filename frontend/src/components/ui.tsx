import { CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { initials } from '../format'
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast shadow-card hover:bg-accent-hover',
  secondary: 'bg-surface text-ink shadow-card ring-1 ring-inset ring-line-strong hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  destructive: 'bg-danger text-danger-contrast shadow-card hover:brightness-110',
  danger: 'text-danger ring-1 ring-inset ring-[color-mix(in_oklab,var(--danger)_35%,transparent)] hover:bg-danger-soft',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-10 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-4 text-[15px]',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
}

export function Button({ variant, size, icon, loading, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <CircleNotchIcon className="size-4 animate-spin" weight="bold" /> : icon}
      {children}
    </button>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  /** Conteúdo à direita do input (ex.: botão mostrar senha). */
  trailing?: ReactNode
  prefix?: string
  /** Mostra "Opcional" ao lado do rótulo. */
  optional?: boolean
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, icon, trailing, prefix, optional, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? props.name
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="flex items-baseline justify-between text-[13px] font-medium text-ink-2">
          {label}
          {optional && <span className="text-xs font-normal text-ink-3">Opcional</span>}
        </label>
      )}
      <div
        className={`group flex h-10 items-center gap-2 rounded-lg border bg-surface px-3 transition-[border-color,box-shadow] focus-within:ring-4 ${
          error
            ? 'border-danger focus-within:ring-danger-soft'
            : 'border-line-strong hover:border-ink-3/50 focus-within:border-accent focus-within:ring-accent-soft'
        }`}
      >
        {icon && <span className="text-ink-3 group-focus-within:text-accent">{icon}</span>}
        {prefix && <span className="text-sm text-ink-3">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3 [&::-webkit-inner-spin-button]:appearance-none"
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-danger">
          <WarningCircleIcon className="size-3.5 shrink-0" weight="bold" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
})

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface shadow-card ${className}`}>{children}</div>
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-sm text-danger">
      <WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="bold" />
      <div>{children}</div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className}`} />
}

export function Avatar({ name, className = 'size-8 text-xs' }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${className}`}>
      {initials(name)}
    </span>
  )
}
