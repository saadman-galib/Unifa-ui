import { Megaphone } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryState } from '@/components/states'
import { dateTime } from '@/lib/format'
import { useAnnouncements, useMarkNotificationRead, useNotifications } from '../api'

export function Communication() {
  const announcements = useAnnouncements()
  const notifications = useNotifications()
  const read = useMarkNotificationRead()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Communication" subtitle="Announcements and your inbox." />

      <div className="grid gap-6 xl:grid-cols-2">
        <QueryState query={announcements}>
          {(rows) => (
            <Card>
              <CardHeader title="Announcements" icon={Megaphone} />
              <CardBody className="flex flex-col gap-3">
                {rows.length === 0 && <p className="text-fg-muted">No announcements yet.</p>}
                {rows.map((a) => (
                  <article key={a.id} className="rounded-control border border-border-strong bg-surface p-4">
                    <p className="text-link text-fg-heading">{a.title}</p>
                    <p className="text-fg-muted">{a.body}</p>
                    <p className="mt-1 text-fg-muted">{dateTime(a.createdAt)}</p>
                  </article>
                ))}
              </CardBody>
            </Card>
          )}
        </QueryState>

        <QueryState query={notifications}>
          {(rows) => (
            <Card>
              <CardHeader title="Notifications" />
              <CardBody className="flex flex-col gap-3">
                {rows.length === 0 && <p className="text-fg-muted">You're all caught up.</p>}
                {rows.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.readAt) read.mutate(n.id)
                    }}
                    className="rounded-control border border-border-strong bg-surface p-4 text-left hover:bg-surface-subtle"
                  >
                    <p className="text-link text-fg-heading">{n.title ?? 'Notice'}</p>
                    <p className="text-fg-muted">{n.body}</p>
                    <p className="mt-1 text-fg-muted">{n.readAt ? 'Read' : 'Unread'}</p>
                  </button>
                ))}
              </CardBody>
            </Card>
          )}
        </QueryState>
      </div>
    </div>
  )
}
