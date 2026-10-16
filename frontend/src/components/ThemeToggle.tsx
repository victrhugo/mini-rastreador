import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react'
import { useTheme, type ThemePreference } from '../theme'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Tema claro', Icon: SunIcon },
  { value: 'dark', label: 'Tema escuro', Icon: MoonIcon },
  { value: 'system', label: 'Tema do sistema', Icon: DesktopIcon },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-lg bg-surface-2 p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={`flex size-7 items-center justify-center rounded-md transition-colors ${
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Icon className="size-4" weight={active ? 'fill' : 'regular'} />
          </button>
        )
      })}
    </div>
  )
}
