/**
 * Marca: um ponto de partida ligado por uma rota pontilhada ao pino de destino.
 * Usa os tokens de cor, então acompanha o tema claro/escuro.
 */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M8.6 22.4c2.6 3.3 8.4 3.6 11.8-.6"
        fill="none"
        stroke="var(--accent-contrast)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="0 3.3"
      />
      <circle cx="8.6" cy="22.4" r="2.6" fill="var(--accent-contrast)" />
      <path
        d="M20.4 21.4s-5.4-5-5.4-9.2a5.4 5.4 0 0 1 10.8 0c0 4.2-5.4 9.2-5.4 9.2Z"
        fill="var(--accent-contrast)"
      />
      <circle cx="20.4" cy="12.2" r="2" fill="var(--accent)" />
    </svg>
  )
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={size === 'lg' ? 'size-10' : 'size-8'} />
      <span className={`leading-none tracking-tight ${size === 'lg' ? 'text-xl' : 'text-[17px]'}`}>
        <span className="font-normal text-ink-3">mini </span>
        <span className="font-semibold text-ink">rastreador</span>
      </span>
    </span>
  )
}
