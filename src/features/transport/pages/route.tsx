import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryState } from '@/components/states'
import { relative } from '@/lib/format'
import { useTransportOverview } from '../api'
import { timeOfDay } from '../format'
import type { RouteStopKind } from '@/types/student'

const KIND_TONE: Record<RouteStopKind, BadgeTone> = {
  START: 'brand',
  STOP: 'neutral',
  DESTINATION: 'success',
}

/**
 * Transport — Route Details — Figma 11:1925.
 *
 * A static, expanded version of the Dashboard's "Route & Stops" timeline.
 * No live map or GPS: this is a mock app with no vehicle to track, so a
 * timeline with a "last updated" timestamp is the honest representation —
 * not a fake pin animating along a road it never drove.
 */
export function RouteDetails() {
  const query = useTransportOverview()

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader title={d.route.name} subtitle={`Pickup point — ${d.route.pickupPoint}`} />

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader title="Route & Stops">
                <span className="text-fg-muted">Updated {relative(d.routeUpdatedAt)}</span>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {d.stops.map((s, i) => (
                  <div key={s.name} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={s.kind === 'STOP' ? 'size-2.5 rounded-full bg-fg-muted/40' : 'size-2.5 rounded-full bg-brand-700'}
                        aria-hidden
                      />
                      {i < d.stops.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-link text-fg-heading">{s.name}</p>
                        <Badge tone={KIND_TONE[s.kind]}>{s.kind}</Badge>
                      </div>
                      <p className="text-fg-muted">{timeOfDay(s.time)}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Vehicle Details" />
              <CardBody>
                <dl className="flex flex-col gap-3">
                  <Row label="Vehicle No" value={d.vehicle.number} />
                  <Row label="Driver" value={d.vehicle.driver} />
                  <Row label="Assistant" value={d.vehicle.assistant} />
                  <Row label="Pickup Time" value={timeOfDay(d.vehicle.pickupTime)} />
                  <Row label="Return Time" value={timeOfDay(d.vehicle.returnTime)} />
                </dl>
              </CardBody>
            </Card>
          </div>

          <p className="text-fg-muted">
            Last updated {relative(d.routeUpdatedAt)}. Live GPS tracking is not available — this
            timeline reflects the confirmed route and schedule.
          </p>
        </div>
      )}
    </QueryState>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right text-link text-fg-heading">{value}</dd>
    </div>
  )
}
