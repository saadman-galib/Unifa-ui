import { useState } from 'react'
import { Laptop, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QueryState } from '@/components/states'
import { ApiError } from '@/hooks/use-api'
import { relative } from '@/lib/format'
import { useChangePassword, useRevokeOtherSessions, useSecurity } from '../api'

/**
 * My Profile — Security — Figma 11:5223.
 *
 * A drill-in from the Profile page, not a `SUB_NAV` pill — matches the
 * breadcrumb in the source frame ("My Profile › Security").
 *
 * 2FA / authenticator management is read-only here: the source frame shows
 * "Edit" / "Manage" affordances with no defined destination, and a real 2FA
 * setup flow needs its own spec, not a guess.
 */
export function Security() {
  const query = useSecurity()
  const changePassword = useChangePassword()
  const revokeOthers = useRevokeOtherSessions()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const passwordError = changePassword.error instanceof ApiError ? changePassword.error : null
  const mismatch = confirm.length > 0 && next !== confirm

  function submit() {
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('')
          setNext('')
          setConfirm('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Change Password & Auth Security" subtitle="Manage your account security, passwords, and two-factor authentication." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Change Password" />
          <CardBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">Current Password</span>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-10" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">New Password</span>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="h-10" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">Confirm New Password</span>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
            </label>

            {mismatch && <p role="alert" className="text-danger">Passwords do not match.</p>}
            {changePassword.isError && (
              <p role="alert" className="text-danger">
                {passwordError?.fieldError('newPassword') ??
                  passwordError?.fieldError('currentPassword') ??
                  passwordError?.detail ??
                  'Could not update your password.'}
              </p>
            )}
            {changePassword.isSuccess && (
              <p role="status" className="text-success">
                {changePassword.data.summary}
              </p>
            )}

            <Button
              disabled={!current || !next || mismatch || changePassword.isPending}
              onClick={submit}
              className="h-11 self-start text-body"
            >
              {changePassword.isPending ? 'Updating…' : 'Update Security Settings'}
            </Button>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <QueryState query={query}>
            {(d) => (
              <Card>
                <CardHeader title="Two-Factor Auth" icon={ShieldCheck}>
                  <Badge tone={d.twoFactorEnabled ? 'success' : 'neutral'}>
                    {d.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-fg-body">SMS Recovery</span>
                    <span className="text-fg-muted">{d.smsRecoveryPhone ?? 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-fg-body">Authenticator App</span>
                    <span className="text-fg-muted">{d.authenticatorConfigured ? 'Configured' : 'Not set up'}</span>
                  </div>
                </CardBody>
              </Card>
            )}
          </QueryState>

          <Card>
            <CardHeader title="Active Sessions" icon={Laptop} />
            <CardBody className="flex flex-col gap-3">
              <QueryState query={query}>
                {(d) => (
                  <>
                    {d.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-control border border-border-strong bg-surface p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-link text-fg-heading">{s.deviceLabel}</p>
                          <p className="truncate text-fg-muted">
                            {s.location ?? 'Unknown location'} • {relative(s.lastSeenAt)}
                          </p>
                        </div>
                        {s.isCurrent && <Badge tone="success">CURRENT</Badge>}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      disabled={revokeOthers.isPending}
                      onClick={() => revokeOthers.mutate()}
                    >
                      {revokeOthers.isPending ? 'Signing out…' : 'Sign out of all other sessions'}
                    </Button>
                    {revokeOthers.isSuccess && (
                      <p role="status" className="text-success">
                        {revokeOthers.data.summary}
                      </p>
                    )}
                  </>
                )}
              </QueryState>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
