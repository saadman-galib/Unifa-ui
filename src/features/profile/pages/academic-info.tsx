import { Mail } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { useProfile } from '../api'

const initials = (name: string) =>
  name.replace(/^(Dr\.|Prof\.)\s*/, '').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/**
 * My Profile — Academic Information — Figma 11:4476.
 *
 * Standing facts only — GPA, credits and semester history already have
 * dedicated, fuller pages (Degree Progress, Credit Progress); this links out
 * rather than recomputing the same numbers a second way.
 */
export function AcademicInfo() {
  const query = useProfile()

  return (
    <QueryState query={query}>
      {(d) => (
        <div className="flex flex-col gap-6">
          <PageHeader title="Academic Information" subtitle={d.academic.enrollmentStatus} />

          <Card>
            <CardHeader title="Academic Standing" />
            <CardBody>
              <dl className="grid gap-6 sm:grid-cols-2">
                <Field label="Program" value={d.programme ?? '—'} />
                <Field label="Faculty" value={d.academic.faculty ?? '—'} />
                <Field
                  label="Admission Date"
                  value={d.academic.admissionDate ? date(d.academic.admissionDate) : '—'}
                />
                <Field
                  label="Expected Graduation"
                  value={d.academic.expectedGraduation ? date(d.academic.expectedGraduation) : '—'}
                />
                <Field label="Campus" value={d.academic.campus ?? '—'} />
                <Field label="Enrollment Status" value={d.academic.enrollmentStatus} />
              </dl>
            </CardBody>
          </Card>

          {d.academic.advisor && (
            <Card>
              <CardHeader title="Academic Advisor" />
              <CardBody className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback>{initials(d.academic.advisor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-link text-fg-heading">{d.academic.advisor.name}</p>
                  {d.academic.advisor.title && <p className="text-fg-muted">{d.academic.advisor.title}</p>}
                  {d.academic.advisor.email && (
                    <a
                      href={`mailto:${d.academic.advisor.email}`}
                      className="flex items-center gap-1.5 text-link text-brand-700 hover:underline"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {d.academic.advisor.email}
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title="GPA & Credits"
              action={{ label: 'View Degree Progress', to: '/student/academic/degree-progress' }}
            />
            <CardBody>
              <p className="text-fg-muted">
                Cumulative GPA and credit completion live on the{' '}
                <Link to="/student/academic/degree-progress" className="text-brand-700 hover:underline">
                  Degree Progress
                </Link>{' '}
                and{' '}
                <Link to="/student/academic/credits" className="text-brand-700 hover:underline">
                  Credit Progress
                </Link>{' '}
                pages.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </QueryState>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow uppercase text-fg-muted">{label}</dt>
      <dd className="text-link text-fg-heading">{value}</dd>
    </div>
  )
}
