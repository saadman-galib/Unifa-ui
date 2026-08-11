import { MapPin } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState, QueryState } from '@/components/states'
import { ApiError } from '@/hooks/use-api'
import { date, relative } from '@/lib/format'
import { useMyBorrowedBooks, useRenewLoan } from '../api'

/** Library — My Borrowed Books — Figma 11:3309. */
export function MyBorrowedBooks() {
  const query = useMyBorrowedBooks()
  const renew = useRenewLoan()

  const error = renew.error instanceof ApiError ? renew.error : null

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader title="My Borrowed Books" subtitle="Manage your active library loans and renewal requests." />

          <Card>
            <CardHeader title={`Active Loans (${d.activeLoans.length})`} />
            <CardBody className="flex flex-col gap-4">
              {d.activeLoans.length === 0 ? (
                <EmptyState title="No active loans" description="Books you borrow will show up here." />
              ) : (
                d.activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-control border border-border-strong bg-surface p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-link text-fg-heading">{loan.book.title}</p>
                      <p className="truncate text-fg-muted">
                        {loan.book.author} • ISBN: {loan.book.isbn}
                      </p>
                      {loan.shelfLocation && (
                        <p className="mt-1 flex items-center gap-1.5 text-fg-muted">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          Shelf: {loan.shelfLocation}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-fg-muted">Borrowed {date(loan.borrowedAt)}</p>
                      <p className="text-link text-fg-heading">
                        Due {date(loan.dueAt)} • {relative(loan.dueAt)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={renew.isPending}
                      onClick={() => renew.mutate(loan.id)}
                    >
                      {renew.isPending && renew.variables === loan.id ? 'Renewing…' : 'Renew'}
                    </Button>
                  </div>
                ))
              )}

              {renew.isError && (
                <p role="alert" className="text-danger">
                  {error?.detail ?? 'Could not renew this loan.'}
                </p>
              )}
              {renew.isSuccess && (
                <p role="status" className="text-success">
                  {renew.data.summary}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </QueryState>
  )
}
