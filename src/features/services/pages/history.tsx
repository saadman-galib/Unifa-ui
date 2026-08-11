import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card } from '@/components/patterns/card'
import { DataTable } from '@/components/patterns/data-table'
import { PageHeader } from '@/components/patterns/page-header'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { useServiceRequests } from '../api'
import type { RequestPriority, RequestStatus, ServiceRequest } from '@/types/student'

const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CLOSED: 'neutral',
}

const PRIORITY_TONE: Record<RequestPriority, BadgeTone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'danger',
}

const FILTERS: (RequestStatus | 'ALL')[] = ['ALL', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']
const FILTER_LABEL: Record<RequestStatus | 'ALL', string> = {
  ALL: 'All Requests',
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
}

/**
 * Student Services — Request History & Audit Directory — Figma 11:2326.
 *
 * Fetches the full list once (status 'ALL') so every tab's count is honest
 * at all times, then filters status and search text client-side.
 */
export function RequestHistory() {
  const [status, setStatus] = useState<RequestStatus | 'ALL'>('ALL')
  const [q, setQ] = useState('')
  const query = useServiceRequests('ALL')

  return (
    <QueryState query={query}>
      {(d) => {
        const shown = d.requests.filter(
          (r) =>
            (status === 'ALL' || r.status === status) &&
            (!q ||
              r.reference.toLowerCase().includes(q.toLowerCase()) ||
              r.subject.toLowerCase().includes(q.toLowerCase())),
        )

        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              title="Request History & Audit Directory"
              subtitle="Track, manage, and audit all official requests submitted to Student Services. Select an item to view detailed status logs."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg border border-border-strong bg-surface p-1">
                {FILTERS.map((f) => {
                  const count = f === 'ALL' ? d.requests.length : d.requests.filter((r) => r.status === f).length
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatus(f)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-body transition-colors',
                        status === f ? 'bg-brand-700 text-brand-fg' : 'text-fg-muted hover:text-fg-heading',
                      )}
                    >
                      {FILTER_LABEL[f]} ({count})
                    </button>
                  )
                })}
              </div>

              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ID or subject…"
                className="h-9 w-[220px]"
              />
            </div>

            <Card>
              <DataTable<ServiceRequest>
                rows={shown}
                getRowKey={(r) => r.id}
                empty={{ title: 'No requests', description: 'Nothing matches your filters.' }}
                columns={[
                  {
                    key: 'ref',
                    header: 'Request ID',
                    cell: (r) => (
                      <Link to={`/student/services/${r.id}`} className="text-link text-brand-700 hover:underline">
                        {r.reference}
                      </Link>
                    ),
                  },
                  { key: 'category', header: 'Category', cell: (r) => r.category },
                  { key: 'subject', header: 'Subject', cell: (r) => r.subject },
                  {
                    key: 'priority',
                    header: 'Priority',
                    cell: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>,
                  },
                  { key: 'submitted', header: 'Submitted', cell: (r) => date(r.submittedAt) },
                ]}
              />
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}
