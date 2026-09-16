import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { GraduationCap, Loader2, ShieldCheck, UserRound } from 'lucide-react'
import type { Role } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/hooks/use-api'
import { homeFor } from '@/lib/auth'
import { DEMO_ACCOUNTS, demoAuthEnabled } from '@/lib/dev-auth'
import { useAuth } from './auth-context'
import { Input } from '@/components/ui/input'

const ROLE_ICON: Record<Role, typeof UserRound> = {
  student: UserRound,
  faculty: GraduationCap,
  admin: ShieldCheck,
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to={homeFor(user.role)} replace />

  async function signIn(nextEmail: string, nextPassword: string) {
    setError(null)
    setPending(true)
    try {
      const next = await login(nextEmail, nextPassword)
      const from = (location.state as { from?: string } | null)?.from
      void navigate(from ?? homeFor(next.role), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Incorrect email or password.'
            : err.detail ?? `Sign in failed (${err.status}). Please try again.`,
        )
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setPending(false)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void signIn(email, password)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="w-full max-w-100">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-control bg-brand-gradient">
            <GraduationCap className="size-6 text-brand-fg" aria-hidden />
          </span>
          <div className="text-center">
            <h1 className="text-card-title">UniFa</h1>
            <p className="text-fg-muted">Sign in to continue</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-card border border-border-strong bg-white p-6 shadow-card"
        >
          <label className="mb-1.5 block text-link text-fg-heading" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 h-11 w-full rounded-control border border-border-strong bg-canvas px-3 outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30"
          />

          <label className="mb-1.5 block text-link text-fg-heading" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 h-11 w-full rounded-control border border-border-strong bg-canvas px-3 outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30"
          />

          {error && (
            <p role="alert" className="mb-4 text-link font-normal text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-body">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>

          {demoAuthEnabled() && (
            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-center text-eyebrow uppercase text-fg-muted">
                Demo accounts — Password123!
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = ROLE_ICON[account.role]
                  return (
                    <button
                      key={account.email}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEmail(account.email)
                        setPassword(account.password)
                        void signIn(account.email, account.password)
                      }}
                      className="flex flex-col items-center gap-1.5 rounded-control border border-border-strong bg-canvas p-3 text-link capitalize text-fg-heading transition-colors hover:border-brand-600 hover:bg-surface-subtle disabled:opacity-50"
                    >
                      <Icon className="size-4.5 text-fg-muted" aria-hidden />
                      {account.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-center text-fg-muted">
                Uses the UniFa API at localhost:4000.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
