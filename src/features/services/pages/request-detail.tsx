import { useParams } from 'react-router'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { useServiceRequestDetail } from '../api'
import type { RequestStatus } from '@/types/student'

const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CLOSED: 'neutral',
}

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/**
 * Student Services — Request Detail — Figma 11:1502.
 *
 * A missing/bad id 404s the endpoint — `QueryState`'s ErrorState already
 * covers that, nothing extra needed here.
 */
export function RequestDetail() {
  const { id = '' } = useParams()
  const query = useServiceRequestDetail(id)

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader title={d.reference} subtitle={`Submitted ${date(d.submittedAt)}`} />

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card>
              <CardBody>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-fg-muted">ID #{d.reference}</span>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status.replace('_', ' ')}</Badge>
                </div>
                <h2 className="text-card-title">{d.subject}</h2>
                <p className="mt-4 text-fg-body">{d.description}</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Request Details" />
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-fg-muted">Category</span>
                  <span className="text-fg-heading">{d.category}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-fg-muted">Priority</span>
                  <span className="text-fg-heading">{d.priority}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-fg-muted">Assigned Dept</span>
                  <span className="text-fg-heading">{d.assignedDept ?? 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-fg-muted">Agent</span>
                  {d.agent ? (
                    <span className="flex items-center gap-2">
                      <Avatar size="sm">
                        {d.agent.avatarUrl && <AvatarImage src={d.agent.avatarUrl} alt={d.agent.name} />}
                        <AvatarFallback>{initials(d.agent.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-fg-heading">{d.agent.name}</span>
                    </span>
                  ) : (
                    <span className="text-fg-heading">Unassigned</span>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </QueryState>
  )
}
