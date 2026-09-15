import { FileBadge } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryState } from '@/components/states'
import { date } from '@/lib/format'
import { displayName } from '@/lib/auth'
import { useDigitalId } from '../api'

function QrImage({ value }: { value: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`
  return <img src={src} width={180} height={180} alt="Digital ID QR code" className="rounded-control bg-white p-2" />
}

export function DigitalId() {
  const query = useDigitalId()

  return (
    <QueryState query={query}>
      {({ card, me }) => (
        <div className="flex flex-col gap-6">
          <PageHeader title="Digital ID" subtitle="Show this card at campus checkpoints." />
          <Card className="mx-auto w-full max-w-[420px]">
            <CardHeader title="Student identity" icon={FileBadge}>
              <Badge tone={card?.active ? 'success' : 'danger'}>{card?.active ? 'Active' : 'Inactive'}</Badge>
            </CardHeader>
            <CardBody className="flex flex-col items-center gap-4 text-center">
              {card ? <QrImage value={card.qrPayload} /> : <p className="text-fg-muted">No digital ID issued yet.</p>}
              <div>
                <p className="text-card-title">{displayName(me)}</p>
                <p className="text-fg-muted">{me.student?.studentNo ?? me.email}</p>
                <p className="text-fg-muted">{me.student?.program.name}</p>
              </div>
              {card && (
                <dl className="grid w-full gap-2 text-left">
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Card number</dt>
                    <dd className="text-link text-fg-heading">{card.cardNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Issued</dt>
                    <dd className="text-fg-heading">{date(card.issuedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Expires</dt>
                    <dd className="text-fg-heading">{date(card.expiresAt)}</dd>
                  </div>
                </dl>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </QueryState>
  )
}
