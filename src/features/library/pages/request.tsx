import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/hooks/use-api'
import { useAcquisitionRequest, useLibraryFeedback } from '../api'

const CATEGORIES = ['Computer Science', 'Software Engineering', 'Physics', 'Mathematics', 'Other']
const TOPICS = ['Facility Maintenance', 'Book Condition', 'Staff Service', 'Digital Access', 'Other']

/** Library — Book Requests — Figma 11:2870. */
export function LibraryRequest() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Book Requests" subtitle="Request new titles for the catalog or send feedback to the library." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AcquisitionForm />
        <FeedbackForm />
      </div>
    </div>
  )
}

function AcquisitionForm() {
  const acquire = useAcquisitionRequest()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [isbn, setIsbn] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [reason, setReason] = useState('')

  const error = acquire.error instanceof ApiError ? acquire.error : null

  function submit() {
    acquire.mutate(
      { title, author, category, isbn: isbn || undefined, publisher: publisher || undefined, publicationYear: publicationYear || undefined, reason },
      {
        onSuccess: () => {
          setTitle('')
          setAuthor('')
          setIsbn('')
          setPublisher('')
          setPublicationYear('')
          setReason('')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader title="New Book Acquisition" />
      <CardBody className="flex flex-col gap-4">
        <p className="text-fg-muted">Enter book specifications for university acquisition consideration.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Book Title *</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter complete title" className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Author(s) *</span>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Enter author names" className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Category *</span>
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
            <span className="text-eyebrow uppercase text-fg-muted">ISBN (Optional)</span>
            <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="e.g. 978-3-16-148410-0" className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Publisher</span>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Enter publisher name" className="h-10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase text-fg-muted">Publication Year</span>
            <Input value={publicationYear} onChange={(e) => setPublicationYear(e.target.value)} placeholder="YYYY" className="h-10" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase text-fg-muted">Reason for Request *</span>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why this book is needed for your studies or research…"
          />
        </label>

        {acquire.isError && (
          <p role="alert" className="text-danger">
            {error?.fieldError('title') ?? error?.fieldError('reason') ?? error?.detail ?? 'Could not submit your request.'}
          </p>
        )}
        {acquire.isSuccess && (
          <p role="status" className="text-success">
            {acquire.data.summary}
          </p>
        )}

        <Button
          disabled={!title.trim() || !reason.trim() || acquire.isPending}
          onClick={submit}
          className="h-11 self-start text-body"
        >
          {acquire.isPending ? 'Submitting…' : 'Submit Acquisition Request'}
        </Button>
      </CardBody>
    </Card>
  )
}

function FeedbackForm() {
  const feedback = useLibraryFeedback()
  const [topic, setTopic] = useState(TOPICS[0])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const error = feedback.error instanceof ApiError ? feedback.error : null

  function submit() {
    feedback.mutate(
      { topic, subject, description },
      {
        onSuccess: () => {
          setSubject('')
          setDescription('')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader title="General Feedback & Complaints" />
      <CardBody className="flex flex-col gap-4">
        <p className="text-fg-muted">Submit feedback regarding library facilities.</p>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase text-fg-muted">Topic</span>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="h-10 w-full" aria-label="Topic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase text-fg-muted">Subject</span>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject line" className="h-10" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase text-fg-muted">Description</span>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details…" />
        </label>

        {feedback.isError && (
          <p role="alert" className="text-danger">
            {error?.fieldError('subject') ?? error?.detail ?? 'Could not submit your feedback.'}
          </p>
        )}
        {feedback.isSuccess && (
          <p role="status" className="text-success">
            {feedback.data.summary}
          </p>
        )}

        <Button disabled={!subject.trim() || feedback.isPending} onClick={submit} className="h-11 self-start text-body">
          {feedback.isPending ? 'Submitting…' : 'Submit Helpdesk Ticket'}
        </Button>
      </CardBody>
    </Card>
  )
}
