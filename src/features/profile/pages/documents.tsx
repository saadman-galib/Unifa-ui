import { useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, QueryState } from '@/components/states'
import { ApiError } from '@/hooks/use-api'
import { date, fileSize } from '@/lib/format'
import { useProfile, useUploadDocument } from '../api'
import type { DocumentCategory } from '@/types/student'

const CATEGORIES: DocumentCategory[] = ['IDENTIFICATION', 'ACADEMIC', 'FINANCIAL', 'MEDICAL']

const STATUS_TONE: Record<'VERIFIED' | 'PENDING', BadgeTone> = {
  VERIFIED: 'success',
  PENDING: 'warning',
}

/** My Profile — Documents — Figma 11:3993 + 11:4395 (upload). */
export function Documents() {
  const query = useProfile()
  const upload = useUploadDocument()

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<DocumentCategory | 'ALL'>('ALL')
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('IDENTIFICATION')

  const error = upload.error instanceof ApiError ? upload.error : null

  function onFile(file: File) {
    const form = new FormData()
    form.append('file', file)
    form.append('category', uploadCategory)
    upload.mutate(form)
  }

  return (
    <QueryState query={query}>
      {(d) => {
        const shown = d.documents.filter(
          (doc) =>
            (category === 'ALL' || doc.category === category) &&
            (!q || doc.filename.toLowerCase().includes(q.toLowerCase())),
        )

        return (
          <div className="flex flex-col gap-6">
            <PageHeader title="Documents" subtitle="Manage your institutional identity and required documents." />

            <Card>
              <CardHeader title="Upload New Document">
                <label className="flex items-center gap-3">
                  <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                    <SelectTrigger className="h-9 w-[160px]" aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-3 text-body text-brand-fg hover:bg-brand-600 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                    <Upload className="size-4" aria-hidden />
                    {upload.isPending ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      className="sr-only"
                      disabled={upload.isPending}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFile(file)
                      }}
                    />
                  </label>
                </label>
              </CardHeader>
              {upload.isError && (
                <CardBody>
                  <p role="alert" className="text-danger">
                    {error?.detail ?? 'Upload failed.'}
                  </p>
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader title="Your Documents">
                <div className="flex items-center gap-3">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search documents…"
                    className="h-9 w-[200px]"
                  />
                  <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory | 'ALL')}>
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
                </div>
              </CardHeader>
              <CardBody>
                {shown.length === 0 ? (
                  <EmptyState title="No documents" description="Nothing matches your filters." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((doc) => (
                      <div key={doc.id} className="rounded-control border border-border-strong bg-surface p-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-brand-600/10 text-brand-700">
                            <FileText className="size-[18px]" aria-hidden />
                          </span>
                          <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
                        </div>
                        <p className="truncate text-link text-fg-heading">{doc.filename}</p>
                        <p className="text-fg-muted">{doc.category}</p>
                        <p className="mt-2 text-fg-muted">
                          {date(doc.uploadedAt)} • {fileSize(doc.sizeBytes)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}
