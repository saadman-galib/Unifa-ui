import { Users } from 'lucide-react'
import { Badge } from '@/components/patterns/badge'
import { Card, CardBody, CardHeader } from '@/components/patterns/card'
import { PageHeader } from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState, QueryState } from '@/components/states'
import { getStoredUser } from '@/lib/auth'
import { useClubs, useJoinClub } from '../api'

export function Clubs() {
  const query = useClubs()
  const join = useJoinClub()
  const mine = getStoredUser()?.studentId

  return (
    <QueryState query={query} empty={{ title: 'No clubs yet' }} isEmpty={(rows) => rows.length === 0}>
      {(clubs) => (
        <div className="flex flex-col gap-6">
          <PageHeader title="Clubs" subtitle="Join a student organisation." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => {
              const member = Boolean(mine && club.memberships?.some((m) => m.studentId === mine))
              return (
                <Card key={club.id}>
                  <CardHeader title={club.name} icon={Users}>
                    <Badge tone={member ? 'success' : 'neutral'}>{member ? 'Member' : 'Open'}</Badge>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-3">
                    <p className="text-fg-muted">{club.description ?? 'No description yet.'}</p>
                    <p className="text-fg-muted">{club.memberships?.length ?? 0} members</p>
                    <Button
                      disabled={member || join.isPending}
                      onClick={() => join.mutate(club.id)}
                      className="self-start"
                    >
                      {member ? 'Joined' : 'Join club'}
                    </Button>
                  </CardBody>
                </Card>
              )
            })}
          </div>
          {clubs.length === 0 && <EmptyState title="No clubs listed" />}
        </div>
      )}
    </QueryState>
  )
}
