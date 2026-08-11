import { Phone } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { useHostelOverview } from '../api'
import type { Roommate } from '@/types'

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

function RoommateRow({ roommate }: { roommate: Roommate }) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-border-strong bg-surface p-4">
      <Avatar size="lg">
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
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600/10 text-brand-700 hover:bg-brand-600/20"
        >
          <Phone className="size-4" aria-hidden />
        </a>
      )}
    </div>
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

/**
 * Hostel — Room Details — Figma 11:1623 (inferred from the Dashboard's "My
 * Hostel Information" + "Roommates" cards, expanded; not yet screenshotted).
 * Reuses the overview GET — no separate endpoint.
 */
export function RoomDetails() {
  const query = useHostelOverview()

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Room Details"
            subtitle={`${d.hostel.name} • Room ${d.hostel.roomNo}`}
            action={<Badge tone={d.status === 'ACTIVE' ? 'success' : 'neutral'}>{d.status}</Badge>}
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader title="Room Information" />
              <CardBody>
                <div className="grid gap-6 sm:grid-cols-[1fr_260px]">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label="Hostel Name" value={d.hostel.name} />
                    <Field label="Room Type" value={d.hostel.roomType} />
                    <Field label="Room No" value={d.hostel.roomNo} />
                    <Field label="Floor" value={d.hostel.floor} />
                    <Field label="Bed No" value={d.hostel.bedNo} />
                    <Field label="Campus" value={d.hostel.campus ?? '—'} />
                    <Field label="Check-in Date" value={date(d.checkInDate)} />
                  </dl>
                  {d.hostel.photoUrl && (
                    <img
                      src={d.hostel.photoUrl}
                      alt={d.hostel.name}
                      className="aspect-video w-full rounded-control object-cover sm:aspect-square"
                    />
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Warden Contact" />
              <CardBody className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback>{initials(d.warden.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-link text-fg-heading">{d.warden.name}</p>
                  <a
                    href={`tel:${d.warden.phone}`}
                    className="flex items-center gap-1.5 text-link text-brand-700 hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {d.warden.phone}
                  </a>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Roommates" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              {d.roommates.length === 0 ? (
                <p className="text-fg-muted">No roommates assigned yet.</p>
              ) : (
                d.roommates.map((r) => <RoommateRow key={r.id} roommate={r} />)
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </QueryState>
  )
}
