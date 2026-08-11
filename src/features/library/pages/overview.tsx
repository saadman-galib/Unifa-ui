import { useState } from 'react'
import { BookMarked, BookOpen, Library, TriangleAlert, Search } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardHeader } from '@/components/patterns/card'
import { DataTable } from '@/components/patterns/data-table'
import { MetricCard } from '@/components/patterns/metric-card'
import { PageHeader } from '@/components/patterns/page-header'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QueryState } from '@/components/states'
import { useLibraryOverview } from '../api'
import type { BookAvailability } from '@/types/student'

const CATEGORIES = ['Computer Science', 'Software Engineering', 'Physics']

const AVAILABILITY_TONE: Record<BookAvailability, BadgeTone> = {
  AVAILABLE: 'success',
  DIGITAL: 'brand',
  UNAVAILABLE: 'danger',
}

const AVAILABILITY_LABEL: Record<BookAvailability, string> = {
  AVAILABLE: 'Available',
  DIGITAL: 'Digital Copy',
  UNAVAILABLE: 'Unavailable',
}

/** Library — Dashboard — Figma 11:3488. */
export function LibraryOverview() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('ALL')
  // Filtering is the server's — the catalog can outgrow a page.
  const query = useLibraryOverview(q.trim(), category)

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader title="Library Dashboard" subtitle="Search, discover and borrow books from the university library." />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Books Catalog" value={String(d.stats.totalBooks)} icon={Library} tone="brand" />
            <MetricCard label="Available Now" value={String(d.stats.availableNow)} icon={BookOpen} tone="success" />
            <MetricCard label="My Borrowed Books" value={String(d.stats.myBorrowedCount)} icon={BookMarked} tone="accent" />
            <MetricCard label="Overdue Books" value={String(d.stats.overdueCount)} icon={TriangleAlert} tone="danger" />
          </div>

          <Card>
            <CardHeader title="Available University Catalog" action={{ label: 'My Borrow History', to: '/student/library/borrowed' }}>
              <div className="flex items-center gap-3">
                <label className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3 size-4.5 text-fg-muted" aria-hidden />
                  <span className="sr-only">Search catalog</span>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by title, author, ISBN…"
                    className="h-9 w-[220px] pl-10"
                  />
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 w-[180px]" aria-label="Filter by category">
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
              </div>
            </CardHeader>
            <DataTable
              rows={d.catalog}
              getRowKey={(r) => r.id}
              empty={{ title: 'No books found', description: 'Nothing matches your search or filter.' }}
              columns={[
                {
                  key: 'book',
                  header: 'Book',
                  cell: (r) => (
                    <div>
                      <p className="text-link text-fg-heading">{r.title}</p>
                      <p className="text-fg-muted">{r.author}</p>
                    </div>
                  ),
                },
                { key: 'category', header: 'Category', cell: (r) => r.category },
                {
                  key: 'isbn',
                  header: 'ISBN / Location',
                  cell: (r) => (
                    <div>
                      <p>{r.isbn}</p>
                      <p className="text-fg-muted">{r.location ?? '—'}</p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <Badge tone={AVAILABILITY_TONE[r.availability]}>
                      {AVAILABILITY_LABEL[r.availability]}
                      {r.availability === 'AVAILABLE' ? ` (${r.availableCount})` : ''}
                    </Badge>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </QueryState>
  )
}
