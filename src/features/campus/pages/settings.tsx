import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/hooks/use-api'
import { useChangePassword } from '../api'

export function Settings() {
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && next !== confirm
  const error = change.error instanceof ApiError ? change.error : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Account security for this portal." />
      <Card className="max-w-[520px]">
        <CardHeader title="Change password" />
        <CardBody className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Current password</span>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">New password</span>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Confirm new password</span>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
          </label>
          {mismatch && <p role="alert" className="text-danger">Passwords do not match.</p>}
          {change.isError && (
            <p role="alert" className="text-danger">
              {error?.detail ?? 'Could not update your password.'}
            </p>
          )}
          {change.isSuccess && (
            <p role="status" className="text-success">
              Password updated.
            </p>
          )}
          <Button
            disabled={!current || !next || mismatch || change.isPending}
            onClick={() =>
              change.mutate(
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
            className="self-start"
          >
            {change.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
