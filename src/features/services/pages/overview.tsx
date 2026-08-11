import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState, QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { useStudentServices } from '../api'
import type { RequestStatus } from '@/types/student'

const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CLOSED: 'neutral',
}

/** Student Services — Dashboard — Figma 11:819 (empty shell in source; body built from the counts + recent requests the endpoint returns). */
export function StudentServicesOverview() {
  const query = useStudentServices()

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Student Services"
            subtitle="Access university services and manage your requests."
            action={
              <Button asChild className="h-10 text-body">
                <Link to="/student/services/new">
                  <Plus className="size-4" aria-hidden />
                  New Request
                </Link>
              </Button>
            }
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Requests" value={String(d.counts.total)} tone="brand" />
            <MetricCard label="In Progress" value={String(d.counts.inProgress)} tone="warning" />
            <MetricCard label="Completed" value={String(d.counts.completed)} tone="success" />
            <MetricCard label="Closed" value={String(d.counts.closed)} tone="info" />
          </div>

          <Card>
            <CardHeader title="Recent Requests" action={{ label: 'View all', to: '/student/services/history' }} />
            <CardBody className="flex flex-col gap-3">
              {d.recent.length === 0 ? (
                <EmptyState
                  title="No requests yet"
                  description="Submit your first service request to get started."
                />
              ) : (
                d.recent.map((r) => (
                  <Link
                    key={r.id}
                    to={`/student/services/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-border-strong bg-surface p-4 hover:bg-surface-subtle"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-link text-fg-heading">{r.subject}</p>
                      <p className="text-fg-muted">
                        {r.reference} • {r.category} • {date(r.submittedAt)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </QueryState>
  )
}
