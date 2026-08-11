import { Bus, Calendar, ClipboardCheck, CreditCard, Map, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { ProgressBar } from '@/components/patterns/progress-bar'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/states'
import { date, money, percent } from '@/lib/format'
import { usePayTransportFee, useTransportOverview } from '../api'
import { timeOfDay } from '../format'

/** Transport — Dashboard — Figma 11:196. */
export function TransportOverview() {
  const query = useTransportOverview()
  const pay = usePayTransportFee()

  return (
    <QueryState query={query}>
      {(d) => {
        const due = Number(d.fee.due) > 0

        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              title="Transport"
              subtitle="Manage your university transport details, routes, and payments."
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="My Route" value={d.route.name} icon={Bus} />
              <MetricCard label="My Pickup Point" value={d.route.pickupPoint} icon={MapPin} />
              <MetricCard label="Transport Fee" value={money(d.fee.monthly)} icon={CreditCard} />
              <MetricCard label="Next Payment" value={date(d.fee.dueDate)} icon={Calendar} />
              <MetricCard label="Attendance" value={percent(d.attendancePercent)} icon={ClipboardCheck} tone="info" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader title="My Transport Details" />
                <CardBody className="flex flex-col gap-3">
                  <dl className="flex flex-col gap-3">
                    <Row label="Vehicle No" value={d.vehicle.number} />
                    <Row label="Driver" value={d.vehicle.driver} />
                    <Row label="Assistant" value={d.vehicle.assistant} />
                    <Row label="Pickup Time" value={timeOfDay(d.vehicle.pickupTime)} />
                    <Row label="Return Time" value={timeOfDay(d.vehicle.returnTime)} />
                  </dl>
                  <Button asChild variant="outline" className="mt-2 h-11 w-full text-body">
                    <Link to="/student/transport/route">
                      <Map className="size-4" aria-hidden />
                      View Route on Map
                    </Link>
                  </Button>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Route & Stops" />
                <CardBody className="flex flex-col gap-4">
                  {d.stops.map((s, i) => (
                    <div key={s.name} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={
                            s.kind === 'STOP'
                              ? 'size-2.5 rounded-full bg-fg-muted/40'
                              : 'size-2.5 rounded-full bg-brand-700'
                          }
                          aria-hidden
                        />
                        {i < d.stops.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                      </div>
                      <div className="min-w-0 flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-link text-fg-heading">{s.name}</p>
                          {s.kind !== 'STOP' && <Badge tone={s.kind === 'START' ? 'brand' : 'success'}>{s.kind}</Badge>}
                        </div>
                        <p className="text-fg-muted">{timeOfDay(s.time)}</p>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader title="Attendance" />
                  <CardBody className="flex flex-col items-center gap-2 text-center">
                    <p className="text-metric text-info">{percent(d.attendancePercent)}</p>
                    <p className="text-fg-muted">Present</p>
                    <ProgressBar value={d.attendancePercent} tone="info" className="mt-2 w-full" />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Transport Fee" />
                  <CardBody className="flex flex-col gap-3">
                    <dl className="flex flex-col gap-3">
                      <Row label="Monthly Fee" value={money(d.fee.monthly)} />
                      <Row label="Paid Amount" value={money(d.fee.paid)} />
                    </dl>
                    <div className="flex justify-between gap-3 border-t border-border pt-3">
                      <span className="text-fg-heading">Due</span>
                      <span className="text-link text-fg-heading">{money(d.fee.due)}</span>
                    </div>
                    <Button
                      disabled={!due || pay.isPending}
                      onClick={() => pay.mutate()}
                      className="h-11 w-full text-body"
                    >
                      {pay.isPending ? 'Paying…' : due ? 'Pay' : 'Paid'}
                    </Button>
                    {pay.isSuccess && (
                      <p role="status" className="text-success">
                        {pay.data.summary}
                      </p>
                    )}
                    {pay.isError && (
                      <p role="alert" className="text-danger">
                        {pay.error.detail ?? 'Could not process the payment.'}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )
      }}
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
