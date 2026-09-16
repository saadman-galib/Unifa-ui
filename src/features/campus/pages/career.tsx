import { useState } from 'react'
import { Briefcase } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { ApiError } from '@/hooks/use-api'
import { useApplyJob, useJobs, useSaveCv } from '../api'

export function Career() {
  const query = useJobs()
  const apply = useApplyJob()
  const cv = useSaveCv()
  const [headline, setHeadline] = useState('CSE undergraduate')
  const [summary, setSummary] = useState('')
  const [cover, setCover] = useState('I am interested in this role.')
  const [applied, setApplied] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Career" subtitle="Jobs, internships, and your CV." />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <QueryState query={query} empty={{ title: 'No openings right now' }} isEmpty={(jobs) => jobs.length === 0}>
          {(jobs) => (
            <div className="flex flex-col gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader title={job.title} icon={Briefcase}>
                    <Badge tone="brand">{job.type}</Badge>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-3">
                    <p className="text-link text-fg-heading">{job.company}</p>
                    <p className="text-fg-muted">{job.description}</p>
                    <p className="text-fg-muted">Deadline {date(job.deadline)}</p>
                    <Button
                      disabled={apply.isPending}
                      onClick={() =>
                        apply.mutate(
                          { jobId: job.id, coverNote: cover },
                          { onSuccess: () => setApplied(job.id) },
                        )
                      }
                      className="self-start"
                    >
                      {applied === job.id ? 'Applied' : 'Apply'}
                    </Button>
                    {apply.error instanceof ApiError && apply.variables?.jobId === job.id && (
                      <p role="alert" className="text-danger">
                        {apply.error.detail}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
              {jobs.length === 0 && <EmptyState title="No job postings" />}
            </div>
          )}
        </QueryState>

        <Card>
          <CardHeader title="Your CV" />
          <CardBody className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">Headline</span>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-10" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">Summary</span>
              <Input value={summary} onChange={(e) => setSummary(e.target.value)} className="h-10" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase text-fg-muted">Cover note</span>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} className="h-10" />
            </label>
            <Button
              onClick={() => cv.mutate({ headline, summary, skills: [] })}
              disabled={cv.isPending}
            >
              {cv.isSuccess ? 'CV saved' : 'Save CV'}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
