import { useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardBody } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/hooks/use-api'
import { useCreateServiceRequest } from '../api'
import type { RequestPriority } from '@/types/student'

const CATEGORIES = ['Academic', 'Financial', 'Housing', 'General', 'Document Request']
const PRIORITIES: { value: RequestPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High/Urgent' },
]

/** Student Services — New Request — Figma 11:2. Attachments are decorative — no upload endpoint exists for this route. */
export function NewServiceRequest() {
  const create = useCreateServiceRequest()

  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const error = create.error instanceof ApiError ? create.error : null

  function submit() {
    create.mutate({ category, priority, subject, description })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Submit a New Service Request"
        subtitle="Please fill out the form details accurately to avoid delays."
      />

      <Card>
        <CardBody className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Service Category</span>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 w-full" aria-label="Service category">
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
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Priority</span>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'h-10 flex-1 rounded-lg border text-body transition-colors',
                      priority === p.value
                        ? 'border-brand-700 bg-brand-700 text-brand-fg'
                        : 'border-border-strong bg-surface text-fg-body hover:bg-surface-subtle',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-link text-fg-heading">Subject</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request for Official Academic Transcript"
              className="h-10"
            />
            {error?.fieldError('subject') && (
              <span className="text-danger">{error.fieldError('subject')}</span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-link text-fg-heading">Description</span>
            <Textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your request in detail…"
            />
            {error?.fieldError('description') && (
              <span className="text-danger">{error.fieldError('description')}</span>
            )}
          </label>

          {/* ponytail: decorative only — no multipart endpoint for this route yet */}
          <div className="flex flex-col gap-1.5">
            <span className="text-link text-fg-heading">Attachments</span>
            <div className="flex cursor-not-allowed flex-col items-center gap-2 rounded-control border-2 border-dashed border-sidebar-line p-8 text-center opacity-50">
              <Upload className="size-5 text-fg-muted" aria-hidden />
              <span className="text-fg-muted">Upload a file or drag and drop</span>
              <span className="text-fg-muted">PNG, JPG, PDF up to 10MB</span>
            </div>
          </div>

          {create.isError && (
            <p role="alert" className="text-danger">
              {error?.detail ?? 'Could not submit your request.'}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              disabled={!subject.trim() || !description.trim() || create.isPending}
              onClick={submit}
              className="h-11 text-body"
            >
              {create.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
