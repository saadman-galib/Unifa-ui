import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Home,
  Megaphone,
  Phone,
  Ticket,
  UserPlus,
  Utensils,
} from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/states'
import { date, money } from '@/lib/format'
import { useHostelOverview } from '../api'
import type { Roommate } from '@/types'

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

const QUICK_LINKS: { label: string; icon: typeof Home; to?: string }[] = [
  { label: 'Hostel Rules', icon: BookOpen },
  { label: 'Mess Menu', icon: Utensils },
  { label: 'Leave Request', icon: CalendarClock, to: '/student/hostel/request' },
  { label: 'Visitor Request', icon: UserPlus, to: '/student/hostel/request' },
  { label: 'Complaint', icon: AlertTriangle, to: '/student/hostel/request' },
  { label: 'Gate Pass', icon: Ticket, to: '/student/hostel/request' },
]

function RoommateRow({ roommate }: { roommate: Roommate }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {roommate.avatarUrl && <AvatarImage src={roommate.avatarUrl} alt="" />}
        <AvatarFallback>{initials(roommate.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-link text-fg-heading">{roommate.name}</p>
        <p className="truncate text-fg-muted">
          Bed {roommate.bedNo} • {roommate.department}
        </p>
      </div>
      {roommate.phone && (
        <a
          href={`tel:${roommate.phone}`}
          aria-label={`Call ${roommate.name}`}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600/10 text-brand-700 hover:bg-brand-600/20"
        >
          <Phone className="size-4" aria-hidden />
        </a>
      )}
    </div>
  )
}

/** Hostel — Dashboard — Figma 11:446. */
export function HostelOverview() {
  const query = useHostelOverview()

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Hostel"
            subtitle="View hostel information, room allocation, fees and hostel services."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard label="Hostel Name" value={d.hostel.name} />
            <MetricCard label="Room No" value={d.hostel.roomNo} tone="accent" />
            <MetricCard label="Bed No" value={d.hostel.bedNo} tone="info" />
            <MetricCard label="Check-in Date" value={date(d.checkInDate)} tone="brand" />
            <MetricCard
              label="Status"
              value={d.status}
              tone={d.status === 'ACTIVE' ? 'success' : 'danger'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader title="My Hostel Information" icon={Home} />
                <CardBody>
                  <div className="grid gap-6 sm:grid-cols-[1fr_260px]">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Field label="Hostel Name" value={d.hostel.name} />
                      <Field label="Room Type" value={d.hostel.roomType} />
                      <Field label="Room No" value={d.hostel.roomNo} />
                      <Field label="Floor" value={d.hostel.floor} />
                      <Field label="Bed No" value={d.hostel.bedNo} />
                    </dl>
                    {d.hostel.photoUrl && (
                      <img
                        src={d.hostel.photoUrl}
                        alt={d.hostel.name}
                        className="aspect-video w-full rounded-control object-cover sm:aspect-square"
                      />
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3 rounded-control border border-border-strong bg-surface-subtle p-4">
                    <Avatar size="lg">
                      <AvatarFallback>{initials(d.warden.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-eyebrow uppercase text-fg-muted">Warden</p>
                      <p className="text-link text-fg-heading">{d.warden.name}</p>
                      <a
                        href={`tel:${d.warden.phone}`}
                        className="flex items-center gap-1.5 text-link text-brand-700 hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {d.warden.phone}
                      </a>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Roommates" action={{ label: 'View All', to: '/student/hostel/room' }} />
                <CardBody className="flex flex-col gap-4">
                  {d.roommates.length === 0 ? (
                    <p className="text-fg-muted">No roommates assigned yet.</p>
                  ) : (
                    d.roommates.slice(0, 3).map((r) => <RoommateRow key={r.id} roommate={r} />)
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Notices & Announcements" icon={Megaphone} />
                <CardBody className="flex flex-col gap-3">
                  {d.notices.length === 0 ? (
                    <p className="text-fg-muted">No notices right now.</p>
                  ) : (
                    d.notices.map((n) => (
                      <div key={n.id} className="rounded-control bg-surface-subtle p-4">
                        <p className="text-link text-fg-heading">{n.title}</p>
                        <p className="text-fg-muted">{date(n.at)}</p>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>

            <aside className="flex flex-col gap-6">
              <Card>
                <CardHeader title="Fee Information" />
                <CardBody className="flex flex-col gap-4">
                  <dl className="flex flex-col gap-3">
                    <FeeRow label="Hostel Fee" value={money(d.fee.hostelFee)} />
                    <FeeRow label="Mess Fee" value={money(d.fee.messFee)} />
                    <FeeRow label="Total Paid" value={money(d.fee.totalPaid)} tone="success" />
                    <FeeRow label="Due Amount" value={money(d.fee.due)} tone="danger" />
                  </dl>
                  <Button asChild className="h-11 w-full text-body">
                    <Link to="/student/hostel/ledger">Pay Hostel Fee</Link>
                  </Button>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Quick Links" />
                <CardBody className="grid grid-cols-2 gap-3">
                  {QUICK_LINKS.map((q) =>
                    q.to ? (
                      <Link
                        key={q.label}
                        to={q.to}
                        className="flex flex-col items-center gap-2 rounded-control border border-border-strong bg-surface p-4 text-center hover:bg-surface-subtle"
                      >
                        <q.icon className="size-5 text-brand-700" aria-hidden />
                        <span className="text-link text-fg-heading">{q.label}</span>
                      </Link>
                    ) : (
                      <div
                        key={q.label}
                        className="flex flex-col items-center gap-2 rounded-control border border-border-strong bg-surface-subtle p-4 text-center opacity-60"
                      >
                        <q.icon className="size-5 text-fg-muted" aria-hidden />
                        <span className="text-link text-fg-muted">{q.label}</span>
                      </div>
                    ),
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Hostel Contact" />
                <CardBody className="flex flex-col gap-3 text-fg-body">
                  <p>Emergency: {d.contact.emergencyPhone}</p>
                  <p>{d.contact.email}</p>
                  <p>{d.contact.office}</p>
                </CardBody>
              </Card>
            </aside>
          </div>
        </div>
      )}
    </QueryState>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow uppercase text-fg-muted">{label}</dt>
      <dd className="text-link text-fg-heading">{value}</dd>
    </div>
  )
}

function FeeRow({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className={tone === 'success' ? 'text-link text-success' : tone === 'danger' ? 'text-link text-danger' : 'text-link text-fg-heading'}>
        {value}
      </dd>
    </div>
  )
}
