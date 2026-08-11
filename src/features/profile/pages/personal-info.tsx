import { useState } from 'react'
import { Link } from 'react-router'
import { Camera, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { QueryState } from '@/components/states'
import { ApiError } from '@/hooks/use-api'
import { date } from '@/lib/format'
import { useProfile, useUpdateProfile, useUploadPhoto } from '../api'
import type { EmergencyContact } from '@/types/student'

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/**
 * My Profile — Personal Information — Figma 11:4256 + 11:3724.
 *
 * Contact/address/emergency-contact are self-editable; identity fields
 * (name, national ID, blood group) belong to the registrar and stay
 * read-only, same split as the faculty profile screen.
 */
export function PersonalInfo() {
  const query = useProfile()
  const update = useUpdateProfile()
  const uploadPhoto = useUploadPhoto()

  const [editing, setEditing] = useState(false)
  const [alternatePhone, setAlternatePhone] = useState<string | null>(null)
  const [presentAddress, setPresentAddress] = useState<string | null>(null)
  const [permanentAddress, setPermanentAddress] = useState<string | null>(null)
  const [sameAsPresent, setSameAsPresent] = useState(false)
  const [contact, setContact] = useState<EmergencyContact | null>(null)

  const error = update.error instanceof ApiError ? update.error : null

  return (
    <QueryState query={query}>
      {(d) => {
        function save() {
          const present = presentAddress ?? d.presentAddress ?? ''
          update.mutate(
            {
              alternatePhone: alternatePhone ?? d.alternatePhone ?? '',
              presentAddress: present,
              permanentAddress: sameAsPresent ? present : (permanentAddress ?? d.permanentAddress ?? ''),
              emergencyContact: contact ?? d.emergencyContact ?? { name: '', relationship: '', phone: '' },
            },
            { onSuccess: () => setEditing(false) },
          )
        }

        function onPhoto(file: File) {
          const form = new FormData()
          form.append('photo', file)
          uploadPhoto.mutate(form)
        }

        return (
          <div className="flex flex-col gap-6">
            <PageHeader
              title="My Profile"
              subtitle={`${d.registrationNo ?? ''} • ${d.programme ?? ''}`}
              action={
                editing ? undefined : (
                  <Button variant="outline" onClick={() => setEditing(true)} className="h-11 text-body">
                    Edit Profile
                  </Button>
                )
              }
            />

            <Card>
              <CardBody className="flex flex-wrap items-center gap-6">
                <div className="relative">
                  <Avatar size="lg" className="size-20">
                    {d.avatarUrl && <AvatarImage src={d.avatarUrl} alt={d.fullName} />}
                    <AvatarFallback className="text-card-title">{initials(d.fullName)}</AvatarFallback>
                  </Avatar>
                  <label className="absolute -right-1 -bottom-1 grid size-7 cursor-pointer place-items-center rounded-full border border-border bg-surface text-fg-muted hover:text-fg-heading">
                    <Camera className="size-3.5" aria-hidden />
                    <span className="sr-only">Change profile photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onPhoto(file)
                      }}
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-card-title">{d.fullName}</h2>
                    <Badge tone={d.status === 'ACTIVE' ? 'success' : 'neutral'}>{d.status}</Badge>
                  </div>
                  <p className="text-fg-muted">
                    {d.programme} {d.department ? `• ${d.department}` : ''}
                  </p>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link to="/student/profile/security">
                    <ShieldCheck className="size-4" aria-hidden />
                    Account Security
                  </Link>
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Contact Details" />
              <CardBody className="flex flex-col gap-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <ReadOnly label="Email" value={d.email} />
                  <ReadOnly label="Blood Group" value={d.bloodGroup ?? '—'} />
                  <ReadOnly label="National ID" value={d.nationalId ?? '—'} />
                  <ReadOnly label="Date of Birth" value={d.dateOfBirth ? date(d.dateOfBirth) : '—'} />
                  <ReadOnly label="Gender" value={d.gender ?? '—'} />
                  <ReadOnly label="Phone" value={d.phone ?? '—'} />

                  {editing ? (
                    <label className="flex flex-col gap-1.5">
                      <span className="text-eyebrow uppercase text-fg-muted">Alternate Phone</span>
                      <Input
                        value={alternatePhone ?? d.alternatePhone ?? ''}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                        className="h-10"
                      />
                    </label>
                  ) : (
                    <ReadOnly label="Alternate Phone" value={d.alternatePhone ?? '—'} />
                  )}
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Address" />
              <CardBody className="flex flex-col gap-4">
                {editing ? (
                  <>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-eyebrow uppercase text-fg-muted">Present Address</span>
                      <Input
                        value={presentAddress ?? d.presentAddress ?? ''}
                        onChange={(e) => setPresentAddress(e.target.value)}
                        className="h-10"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={sameAsPresent} onCheckedChange={(v) => setSameAsPresent(v === true)} />
                      <span className="text-fg-body">Same as present address</span>
                    </label>
                    {!sameAsPresent && (
                      <label className="flex flex-col gap-1.5">
                        <span className="text-eyebrow uppercase text-fg-muted">Permanent Address</span>
                        <Input
                          value={permanentAddress ?? d.permanentAddress ?? ''}
                          onChange={(e) => setPermanentAddress(e.target.value)}
                          className="h-10"
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <ReadOnly label="Present Address" value={d.presentAddress ?? '—'} />
                    <ReadOnly label="Permanent Address" value={d.permanentAddress ?? '—'} />
                  </dl>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Emergency Contact" />
              <CardBody className="flex flex-col gap-4">
                {editing ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-eyebrow uppercase text-fg-muted">Contact Name</span>
                      <Input
                        value={(contact ?? d.emergencyContact)?.name ?? ''}
                        onChange={(e) =>
                          setContact({
                            name: e.target.value,
                            relationship: (contact ?? d.emergencyContact)?.relationship ?? '',
                            phone: (contact ?? d.emergencyContact)?.phone ?? '',
                          })
                        }
                        className="h-10"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-eyebrow uppercase text-fg-muted">Relationship</span>
                      <Input
                        value={(contact ?? d.emergencyContact)?.relationship ?? ''}
                        onChange={(e) =>
                          setContact({
                            name: (contact ?? d.emergencyContact)?.name ?? '',
                            relationship: e.target.value,
                            phone: (contact ?? d.emergencyContact)?.phone ?? '',
                          })
                        }
                        className="h-10"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-eyebrow uppercase text-fg-muted">Phone Number</span>
                      <Input
                        value={(contact ?? d.emergencyContact)?.phone ?? ''}
                        onChange={(e) =>
                          setContact({
                            name: (contact ?? d.emergencyContact)?.name ?? '',
                            relationship: (contact ?? d.emergencyContact)?.relationship ?? '',
                            phone: e.target.value,
                          })
                        }
                        className="h-10"
                      />
                    </label>
                  </div>
                ) : (
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <ReadOnly label="Contact Name" value={d.emergencyContact?.name ?? '—'} />
                    <ReadOnly label="Relationship" value={d.emergencyContact?.relationship ?? '—'} />
                    <ReadOnly label="Phone Number" value={d.emergencyContact?.phone ?? '—'} />
                  </dl>
                )}

                {update.isError && (
                  <p role="alert" className="text-danger">
                    {error?.detail ?? 'Could not save your changes.'}
                  </p>
                )}

                {editing && (
                  <div className="flex gap-2">
                    <Button disabled={update.isPending} onClick={save} className="h-11 text-body">
                      {update.isPending ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() => {
                        setEditing(false)
                        setAlternatePhone(null)
                        setPresentAddress(null)
                        setPermanentAddress(null)
                        setContact(null)
                      }}
                    >
                      Cancel
                    </Button>
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

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow uppercase text-fg-muted">{label}</dt>
      <dd className="text-link text-fg-heading">{value}</dd>
    </div>
  )
}
