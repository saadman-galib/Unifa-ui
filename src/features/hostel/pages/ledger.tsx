import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardHeader } from '@/components/patterns/card'
import { DataTable } from '@/components/patterns/data-table'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/states'
import { date, money } from '@/lib/format'
import { useHostelLedger, usePayHostelFee } from '../api'
import type { HostelFeeKind, HostelPaymentStatus } from '@/types'

const KIND_LABEL: Record<HostelFeeKind, string> = {
  HOSTEL_FEE: 'Hostel Fee',
  MESS_FEE: 'Mess Fee',
}

const TONE: Record<HostelPaymentStatus, BadgeTone> = {
  PAID: 'success',
  DUE: 'warning',
  OVERDUE: 'danger',
}

/** Hostel — Fee Ledger — Figma 11:914 (built like payment-history.tsx; not yet screenshotted). */
export function HostelLedger() {
  const query = useHostelLedger()
  const pay = usePayHostelFee()

  return (
    <QueryState query={query}>
      {(d) => {
        const totalPaid = d.payments
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0)
        const due = d.payments
          .filter((p) => p.status !== 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0)

        return (
          <div className="flex flex-col gap-6">
            <PageHeader title="Hostel Fee Ledger" subtitle="Hostel and mess fee payments." />

            <div className="grid gap-6 sm:grid-cols-2">
              <MetricCard label="Total Paid" value={money(totalPaid)} tone="success" />
              <MetricCard label="Outstanding Due" value={money(due)} tone={due > 0 ? 'danger' : 'brand'} />
            </div>

            <Card>
              <CardHeader title="Payments" />
              <DataTable
                rows={d.payments}
                getRowKey={(r) => r.id}
                empty={{ title: 'No payments yet' }}
                columns={[
                  { key: 'kind', header: 'Fee Type', cell: (r) => KIND_LABEL[r.kind] },
                  { key: 'amount', header: 'Amount', cell: (r) => money(r.amount) },
                  { key: 'due', header: 'Due Date', cell: (r) => date(r.dueAt) },
                  { key: 'paid', header: 'Paid Date', cell: (r) => (r.paidAt ? date(r.paidAt) : '—') },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
                  },
                  {
                    key: 'action',
                    header: '',
                    className: 'text-right',
                    cell: (r) =>
                      r.status === 'PAID' ? null : (
                        <Button
                          size="sm"
                          disabled={pay.isPending && pay.variables?.paymentId === r.id}
                          onClick={() => pay.mutate({ paymentId: r.id })}
                        >
                          {pay.isPending && pay.variables?.paymentId === r.id ? 'Paying…' : 'Pay'}
                        </Button>
                      ),
                  },
                ]}
              />
            </Card>

            {pay.isError && (
              <p role="alert" className="text-danger">
                {pay.error?.detail ?? 'Payment failed.'}
              </p>
            )}
          </div>
        )
      }}
    </QueryState>
  )
}
