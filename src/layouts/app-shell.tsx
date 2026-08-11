import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { Bell, LogOut, Menu, Search, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/auth-context'
import { homeFor, type Role } from '@/lib/auth'
import { BRAND_ICON, BRAND_SUBTITLE, NAV, SUB_NAV, type NavEntry } from './nav-config'
import { NavItem } from './nav-item'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * One shell, driven by role. The three personas differ only in the sidebar
 * treatment (design.md §1.1) — that is not enough divergence to justify three
 * components.
 *
 * Layout: 256/260px sidebar · 64px topbar · 40px content canvas (design.md §2).
 */
export function AppShell({ role }: { role: Role }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />

  const dark = role === 'admin'
  const subNav = Object.entries(SUB_NAV).find(([base]) => location.pathname.startsWith(base))?.[1]

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar role={role} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className={cn('flex min-h-screen flex-col', role === 'student' ? 'lg:pl-64' : 'lg:pl-65')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-canvas/80 px-6 backdrop-blur-[6px] lg:px-10">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-control p-2 text-fg-body hover:bg-surface-subtle lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <NavSearch role={role} />

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-control p-2 text-fg-body hover:bg-surface-subtle"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-3">
                <p className="text-link text-fg-heading">Notifications</p>
                <p className="mt-1 text-fg-muted">You're all caught up — nothing new right now.</p>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to={`/${role}/settings`}
              className="rounded-control p-2 text-fg-body hover:bg-surface-subtle"
              aria-label="Settings"
            >
              <Settings className="size-5" aria-hidden />
            </Link>

            <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-link text-fg-heading">{user.name}</p>
                {user.subtitle && <p className="text-eyebrow uppercase text-fg-muted">{user.subtitle}</p>}
              </div>
              <UserAvatar user={user} />
              <button
                type="button"
                onClick={logout}
                className="rounded-control p-2 text-fg-muted hover:bg-surface-subtle hover:text-fg-body"
                aria-label="Sign out"
              >
                <LogOut className="size-4.5" aria-hidden />
              </button>
            </div>
          </div>
        </header>

        {subNav && (
          <nav
            aria-label="Section"
            className="flex gap-1 overflow-x-auto border-b border-border bg-surface-subtle px-6 py-2 lg:px-10"
          >
            {subNav.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-link transition-colors',
                  location.pathname === s.to
                    ? 'bg-brand-700 text-brand-fg'
                    : 'text-fg-body hover:bg-surface',
                )}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        )}

        <main className={cn('flex-1 p-6 lg:p-10', dark && 'bg-canvas')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/**
 * Jumps to a sidebar destination by label — the only "anything" this
 * portal has to search is its own nav, so that is what backs the promise
 * in the placeholder. Cmd/Ctrl+K focuses it from anywhere in the shell.
 */
function NavSearch({ role }: { role: Role }) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const entries = NAV[role].filter((e): e is Extract<NavEntry, { kind: 'link' }> => e.kind === 'link')
  const q = query.trim().toLowerCase()
  const results = (q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries).slice(0, 8)

  function go(to: string) {
    navigate(to)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative hidden max-w-[320px] flex-1 sm:block">
      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 size-4.5 text-fg-muted" aria-hidden />
        <span className="sr-only">Search</span>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search anything (Ctrl+K)"
          className="h-10 pl-10"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              inputRef.current?.blur()
            } else if (e.key === 'Enter' && results[0]) {
              go(results[0].to)
            }
          }}
        />
      </label>

      {open && (
        <div className="absolute top-[calc(100%+4px)] z-30 w-full rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {results.length === 0 ? (
            <p className="p-3 text-fg-muted">No pages match “{query}”.</p>
          ) : (
            results.map((entry) => (
              <button
                key={entry.to}
                type="button"
                onClick={() => go(entry.to)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-fg-body hover:bg-surface-subtle"
              >
                <entry.icon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                {entry.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function UserAvatar({ user }: { user: { name: string; avatar?: string } }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <Avatar className="size-10 shrink-0">
      <AvatarImage src={user.avatar} alt="" />
      <AvatarFallback className="bg-nav-active-student text-link text-brand-700">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function Sidebar({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const dark = role === 'admin'
  const BrandIcon = BRAND_ICON[role]

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-fg-heading/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          role === 'student' && 'w-64 border-r border-sidebar-line bg-canvas',
          role === 'faculty' && 'w-65 bg-sidebar',
          dark && 'w-65 bg-sidebar-dark',
        )}
      >
        <div className="flex items-center gap-2 p-4">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-control',
              dark ? 'bg-accent-500' : 'bg-brand-600',
            )}
          >
            <BrandIcon className="size-5 text-brand-fg" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={cn('text-card-title', dark ? 'text-fg-on-dark-strong' : 'text-brand-700')}>
              UniGPT
            </p>
            <p className={cn('text-eyebrow uppercase', dark ? 'text-fg-on-dark' : 'text-fg-muted')}>
              {BRAND_SUBTITLE[role]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-control p-2 text-fg-muted hover:bg-surface-subtle lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Closing on any nav click beats a pathname effect — on desktop the
            drawer is already closed, so this is a no-op state set. */}
        <nav aria-label="Main" onClick={onClose} className="flex flex-1 flex-col gap-1 p-4">
          {NAV[role].map((entry, i) => {
            if (entry.kind === 'divider') {
              return (
                <Separator
                  key={`d${i}`}
                  className={cn('my-1', dark ? 'bg-white/10' : 'bg-border')}
                />
              )
            }
            if (entry.kind === 'spacer') return <div key={`s${i}`} className="flex-1" />
            return <NavItem key={entry.to} entry={entry} role={role} />
          })}
        </nav>

        {user && (
          <div className={cn('border-t p-4', dark ? 'border-white/10' : 'border-sidebar-line')}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-control border p-2',
                dark ? 'border-white/10 bg-white/5' : 'border-border-strong bg-surface',
              )}
            >
              <UserAvatar user={user} />
              <div className="min-w-0">
                <p className={cn('truncate text-link', dark ? 'text-fg-on-dark-strong' : 'text-fg-heading')}>
                  {user.name}
                </p>
                {user.subtitle && (
                  <p className={cn('truncate text-eyebrow', dark ? 'text-fg-on-dark' : 'text-fg-muted')}>
                    {user.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
