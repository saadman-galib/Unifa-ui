import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateHostelRequest } from '../api'
import type { RequestPriority } from '@/types'

const CATEGORIES = ['Leave Request', 'Visitor Request', 'Complaint', 'Gate Pass']

const PRIORITIES: { id: RequestPriority; label: string }[] = [
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
]

/**
 * Hostel — Service Requests — Figma 11:2023 (inferred from the Dashboard's
 * Quick Links tile names — Leave Request, Visitor Request, Complaint, Gate
 * Pass; not yet screenshotted). Shaped identically to Student Services' New
 * Request / Transport's Request Desk.
 */
export function HostelRequest() {
  const create = useCreateHostelRequest()

  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const canSubmit = subject.trim().length > 0 && !create.isPending

  function send() {
    create.mutate({ category, priority, subject, description })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Hostel Request" subtitle="Raise a leave, visitor, complaint or gate pass request." />

      <Card>
        <CardHeader title="Request Details" />
        <CardBody className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Category</span>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 w-full" aria-label="Category">
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

            <label className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Priority</span>
              <Select value={priority} onValueChange={(v) => setPriority(v as RequestPriority)}>
                <SelectTrigger className="h-10 w-full" aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-link text-fg-heading">Subject</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request"
              aria-invalid={create.error?.fieldError('subject') ? true : undefined}
            />
            {create.error?.fieldError('subject') && (
              <span className="text-danger">{create.error.fieldError('subject')}</span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-link text-fg-heading">Description</span>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your request in detail…"
            />
          </label>

          {create.isError && !create.error?.fieldError('subject') && (
            <p role="alert" className="text-danger">
              {create.error?.detail ?? 'Could not submit your request.'}
            </p>
          )}

          {create.isSuccess ? (
            <p role="status" className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Request {create.data.reference} submitted.
            </p>
          ) : (
            <Button disabled={!canSubmit} onClick={send} className="h-11 w-full text-body">
              {create.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
