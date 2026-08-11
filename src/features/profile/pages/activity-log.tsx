import { useState } from 'react'
import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, QueryState } from '@/components/states'
import { dateTime } from '@/lib/format'
import { useProfile } from '../api'
import type { ActivityCategory, ActivityEntry } from '@/types/student'

const CATEGORIES: ActivityCategory[] = ['ACADEMIC', 'SECURITY', 'SYSTEM']

const TONE: Record<ActivityCategory, BadgeTone> = {
  ACADEMIC: 'brand',
  SECURITY: 'warning',
  SYSTEM: 'neutral',
}

const ICON: Record<ActivityCategory, typeof GraduationCap> = {
  ACADEMIC: GraduationCap,
  SECURITY: ShieldCheck,
  SYSTEM: LogIn,
}

/** My Profile — Activity Log — Figma 11:4782. */
export function ActivityLog() {
  const query = useProfile()
  const [category, setCategory] = useState<ActivityCategory | 'ALL'>('ALL')

  return (
    <QueryState query={query}>
      {(d) => {
        const shown = d.activity.filter((a) => category === 'ALL' || a.category === category)

        return (
          <div className="flex flex-col gap-6">
            <PageHeader title="Activity Log" subtitle="Every change and sign-in recorded to your account." />

            <Card>
              <CardHeader title="Audit Trail">
                <Select value={category} onValueChange={(v) => setCategory(v as ActivityCategory | 'ALL')}>
                  <SelectTrigger className="h-9 w-[160px]" aria-label="Filter by category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardBody>
                {shown.length === 0 ? (
                  <EmptyState title="No activity" description="Nothing matches this filter." />
                ) : (
                  <ol className="flex flex-col gap-4">
                    {shown.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} />
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = ICON[entry.category]
  return (
    <li className="flex gap-3 border-l-2 border-nav-active-student pl-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-subtle text-fg-muted">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-link text-fg-heading">{entry.title}</p>
          <p className="text-fg-muted">{dateTime(entry.at)}</p>
        </div>
        {entry.detail && <p className="text-fg-muted">{entry.detail}</p>}
        <Badge tone={TONE[entry.category]} className="mt-1">
          {entry.category}
        </Badge>
      </div>
    </li>
  )
}
