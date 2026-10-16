import { ListBulletsIcon, PlusIcon, SignOutIcon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Avatar } from './ui'

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <Link to="/orders" className="px-2.5">
          <Logo />
        </Link>

        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Principal">
          <SideLink to="/orders" end icon={<ListBulletsIcon className="size-[18px]" />}>Pedidos</SideLink>
          <SideLink to="/orders/new" icon={<PlusIcon className="size-[18px]" />}>Novo pedido</SideLink>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between px-2.5">
            <span className="text-xs text-ink-3">Tema</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-line p-2.5">
            {user && <Avatar name={user.name} />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-ink-3">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Sair"
              title="Sair"
            >
              <SignOutIcon className="size-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <Link to="/orders"><Logo /></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-md p-2 text-ink-3 hover:bg-surface-2 hover:text-ink"
            aria-label="Sair"
          >
            <SignOutIcon className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}

function SideLink({ to, end, icon, children }: { to: string; end?: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
          isActive ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2 hover:bg-surface-2/70 hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-accent' : 'text-ink-3'}>{icon}</span>
          {children}
        </>
      )}
    </NavLink>
  )
}
