import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardHeader } from '@/components/patterns/card'
import { DataTable } from '@/components/patterns/data-table'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/states'
import { date, money } from '@/lib/format'
import { usePayTransportFee, useTransportPayments } from '../api'
import type { TransportPaymentStatus } from '@/types/student'

const TONE: Record<TransportPaymentStatus, BadgeTone> = {
  PAID: 'success',
  DUE: 'warning',
  OVERDUE: 'danger',
}

/**
 * Transport — Payment History — Figma 1:1217 (inferred from
 * PaymentHistory.tsx's ledger pattern; not yet screenshotted).
 */
export function TransportPayments() {
  const query = useTransportPayments()
  const pay = usePayTransportFee()

  return (
    <QueryState query={query}>
      {(d) => {
        const totalPaid = d.payments
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0)
        const next = d.payments.find((p) => p.status !== 'PAID') ?? null

        return (
          <div className="flex flex-col gap-6">
            <PageHeader title="Transport Payments" subtitle="Every transport fee charge on your account." />

            <div className="grid gap-6 sm:grid-cols-2">
              <MetricCard label="Total Paid This Year" value={money(totalPaid)} tone="success" />
              <MetricCard
                label="Next Due"
                value={next ? money(next.amount) : '—'}
                unit={next ? next.month : undefined}
                tone={next ? 'warning' : 'success'}
              />
            </div>

            <Card>
              <CardHeader title="Transactions" />
              <DataTable
                rows={d.payments}
                getRowKey={(r) => r.id}
                empty={{ title: 'No transport payments yet' }}
                columns={[
                  { key: 'month', header: 'Month', cell: (r) => <span className="text-fg-heading">{r.month}</span> },
                  { key: 'amount', header: 'Amount', cell: (r) => money(r.amount), className: 'text-right' },
                  { key: 'paidAt', header: 'Paid Date', cell: (r) => (r.paidAt ? date(r.paidAt) : '—') },
                  { key: 'status', header: 'Status', cell: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
                  {
                    key: 'action',
                    header: '',
                    className: 'text-right',
                    cell: (r) =>
                      r.status !== 'PAID' && r.month === next?.month ? (
                        <Button size="sm" disabled={pay.isPending} onClick={() => pay.mutate()}>
                          {pay.isPending ? 'Paying…' : 'Pay'}
                        </Button>
                      ) : null,
                  },
                ]}
              />
            </Card>

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
          </div>
        )
      }}
    </QueryState>
  )
}
