import { useState } from 'react'
import { AlertTriangle, Bus, CheckCircle2, Route, Ticket, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
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
import { cn } from '@/lib/utils'
import { useCreateTransportRequest } from '../api'

const CATEGORIES = [
  { label: 'New Pass', icon: Ticket },
  { label: 'Route Change', icon: Route },
  { label: 'Cancel Pass', icon: XCircle },
  { label: 'Temp Pass', icon: Bus },
  { label: 'Report Issue', icon: AlertTriangle },
]

// No route catalog exists for the mock — a free-text select of the same
// route names shown on the Dashboard/Route pages stands in for it.
const ROUTES = ['Green Line', 'Red Line (North Campus)', 'Blue Line', 'Yellow Line']

/** Transport — Request & Change Desk — Figma 11:2612. */
export function TransportRequest() {
  const create = useCreateTransportRequest()

  const [category, setCategory] = useState('Route Change')
  const [targetRoute, setTargetRoute] = useState('')
  const [targetPickupPoint, setTargetPickupPoint] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const error = create.error instanceof ApiError ? create.error : null
  const canSubmit = subject.trim().length > 0 && !create.isPending

  function submit() {
    const details = [targetRoute && `New route: ${targetRoute}`, targetPickupPoint && `New pickup point: ${targetPickupPoint}`]
      .filter(Boolean)
      .join('. ')
    create.mutate({
      category,
      priority: 'MEDIUM',
      subject,
      description: details ? `${details}. ${description}` : description,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Transport Request & Change Desk" subtitle="Request a new pass, change your route, or report an issue." />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Request Type" />
          <CardBody className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-control border p-4 text-center transition-colors',
                    category === c.label
                      ? 'border-brand-700 bg-brand-600/10 text-brand-700'
                      : 'border-border-strong bg-surface text-fg-body hover:bg-surface-subtle',
                  )}
                >
                  <c.icon className="size-5" aria-hidden />
                  <span className="text-link">{c.label}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-link text-fg-heading">Target New Route</span>
                <Select value={targetRoute} onValueChange={setTargetRoute}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-link text-fg-heading">Target New Pickup Point</span>
                <Input
                  value={targetPickupPoint}
                  onChange={(e) => setTargetPickupPoint(e.target.value)}
                  placeholder="e.g. Oak Street Station"
                  className="h-10"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Subject</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your request"
                className="h-10"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-link text-fg-heading">Detailed Description</span>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain your request in detail…"
              />
            </label>

            {create.isError && (
              <p role="alert" className="text-danger">
                {error?.fieldError('subject') ?? error?.detail ?? 'Could not submit your request.'}
              </p>
            )}
            {create.isSuccess ? (
              <p role="status" className="text-success">
                Submitted as {create.data.reference}.
              </p>
            ) : (
              <Button disabled={!canSubmit} onClick={submit} className="h-11 self-start text-body">
                {create.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            )}
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Route Change Guidelines" />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {[
                'Requests are processed within 3 business days.',
                'A valid proof of address change is required if moving to a different zone.',
                'Your current pass remains active until the new one is issued.',
                'Route changes are subject to seat availability on the target bus line.',
              ].map((tip) => (
                <li key={tip} className="flex gap-2 text-fg-body">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
