import { CircleCheck, TriangleAlert } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { DataTable } from '@/components/patterns/data-table'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/states'
import { ApiError } from '@/hooks/use-api'
import { date, money } from '@/lib/format'
import { useLibraryHistory, usePayLibraryFines } from '../api'
import type { LoanStatus } from '@/types/student'

const STATUS_TONE: Record<LoanStatus, BadgeTone> = {
  ACTIVE: 'info',
  RETURNED: 'success',
  LATE_RETURN: 'danger',
}

/** Library — History & Fines — Figma 11:3066. */
export function LibraryHistory() {
  const query = useLibraryHistory()
  const payFines = usePayLibraryFines()

  const error = payFines.error instanceof ApiError ? payFines.error : null

  return (
    <QueryState query={query}>
      {(d) => {
        const hasFines = d.outstandingFines !== '0.00' && !payFines.isSuccess

        return (
          <div className="flex flex-col gap-6">
            <PageHeader title="Library History & Fines" subtitle="Review your past borrows and manage any outstanding fines." />

            <Card>
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {hasFines ? (
                    <TriangleAlert className="size-5 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
                  )}
                  <div>
                    <p className="text-card-title">
                      {hasFines ? `Outstanding Fines: ${money(d.outstandingFines)}` : 'No Outstanding Fines'}
                    </p>
                    <p className="text-fg-muted">
                      {hasFines ? 'Settle your balance to keep borrowing privileges active.' : 'Your library account is in good standing.'}
                    </p>
                  </div>
                </div>

                {hasFines && (
                  <Button disabled={payFines.isPending} onClick={() => payFines.mutate()} className="h-11 text-body">
                    {payFines.isPending ? 'Processing…' : `Pay Outstanding Fines (${money(d.outstandingFines)})`}
                  </Button>
                )}
              </CardBody>
              {payFines.isError && (
                <CardBody className="pt-0">
                  <p role="alert" className="text-danger">
                    {error?.detail ?? 'Could not process payment.'}
                  </p>
                </CardBody>
              )}
              {payFines.isSuccess && (
                <CardBody className="pt-0">
                  <p role="status" className="text-success">
                    {payFines.data.summary}
                  </p>
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader title="Full Borrow History Ledger" />
              <DataTable
                rows={d.loans}
                getRowKey={(r) => r.id}
                empty={{ title: 'No borrow history yet' }}
                columns={[
                  {
                    key: 'book',
                    header: 'Book Details',
                    cell: (r) => (
                      <div>
                        <p className="text-link text-fg-heading">{r.book.title}</p>
                        <p className="text-fg-muted">
                          {r.book.author} • {r.book.isbn}
                        </p>
                      </div>
                    ),
                  },
                  { key: 'borrowed', header: 'Borrow Date', cell: (r) => date(r.borrowedAt) },
                  {
                    key: 'returned',
                    header: 'Due / Return Date',
                    cell: (r) => (r.returnedAt ? `Returned ${date(r.returnedAt)}` : `Due ${date(r.dueAt)}`),
                  },
                  { key: 'status', header: 'Status', cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge> },
                  { key: 'fine', header: 'Fine', cell: (r) => (r.fine ? money(r.fine) : '—'), className: 'text-right' },
                ]}
              />
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}
