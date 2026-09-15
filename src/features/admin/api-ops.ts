import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import type {
  AdminSettingsResponse,
  SaveSettingsRequest,
  SaveSettingsResult,
  SupportResponse,
  SystemHealthResponse,
  Ticket,
  UpdateTicketRequest,
} from '@/types/admin'
import type { UnifaHealth, UnifaSetting, UnifaTicket } from '@/types/unifa'

export const useSystemHealth = () =>
  useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async (): Promise<SystemHealthResponse> => {
      const health = await apiFetch<UnifaHealth>('/health')
      return {
        overall: { state: health.ok ? 'OPERATIONAL' : 'DOWN', note: health.service ?? 'UniFa API' },
        metrics: [{ label: 'API', value: health.ok ? 'Up' : 'Down', tone: health.ok ? 'success' : 'danger' }],
        services: [
          {
            id: 'api',
            name: health.product ?? 'UniFa',
            state: health.ok ? 'OPERATIONAL' : 'DOWN',
            uptimePercent: health.ok ? 100 : 0,
            latencyMs: 0,
            checkedAt: new Date().toISOString(),
          },
        ],
        incidents: [],
      }
    },
    refetchInterval: 30_000,
    staleTime: 0,
  })

const SETTINGS_KEY = ['admin', 'settings']

export const useAdminSettings = () =>
  useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async (): Promise<AdminSettingsResponse> => {
      const rows = await apiFetch<UnifaSetting[]>('/api/v1/faculty/settings')
      const get = (key: string, fallback: string) => rows.find((r) => r.key === key)?.value ?? fallback
      return {
        version: String(rows.length),
        institution: {
          name: get('institution.name', 'UniFa University'),
          shortCode: get('institution.code', 'UNIFA'),
          contactEmail: get('institution.email', 'admin@unifa.edu'),
          timezone: get('institution.timezone', 'Asia/Dhaka'),
        },
        term: {
          activeTermId: 'current',
          activeTermName: get('term.name', 'Current term'),
          startsOn: get('term.start', new Date().toISOString().slice(0, 10)),
          endsOn: get('term.end', new Date().toISOString().slice(0, 10)),
          fullTimeCreditMinimum: Number(get('term.credits', '12')),
        },
        toggles: rows
          .filter((r) => r.value === 'true' || r.value === 'false')
          .map((r) => ({
            key: r.key,
            label: r.key,
            note: '',
            enabled: r.value === 'true',
            institutionWide: true,
          })),
      }
    },
  })

export const useSaveSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: SaveSettingsRequest): Promise<SaveSettingsResult> => {
      await apiFetch(`/api/v1/faculty/settings/${encodeURIComponent('institution.name')}`, {
        method: 'PUT',
        body: JSON.stringify({ value: vars.institution.name }),
      })
      for (const t of vars.toggles) {
        await apiFetch(`/api/v1/faculty/settings/${encodeURIComponent(t.key)}`, {
          method: 'PUT',
          body: JSON.stringify({ value: String(t.enabled) }),
        })
      }
      return { settings: await queryClient.fetchQuery({ queryKey: SETTINGS_KEY }), audit: { id: crypto.randomUUID(), action: 'settings.save', actorName: 'You', at: new Date().toISOString(), summary: 'Settings saved' } }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
}

const SUPPORT_KEY = ['admin', 'support']

const ticketStatus = (s: string): Ticket['status'] =>
  s === 'CLOSED' || s === 'APPROVED' || s === 'REJECTED' ? 'CLOSED' : s === 'IN_REVIEW' ? 'PENDING' : 'OPEN'

export const useSupport = () =>
  useQuery({
    queryKey: SUPPORT_KEY,
    queryFn: async (): Promise<SupportResponse> => {
      const tickets = await apiFetch<UnifaTicket[]>('/api/v1/campus/tickets')
      return {
        channels: [{ id: 'email', label: 'Email', value: 'support@unifa.edu', note: 'Staff inbox' }],
        tickets: tickets.map((t) => ({
          id: t.id,
          reference: t.id.slice(-8).toUpperCase(),
          subject: t.title ?? t.subject ?? t.type,
          fromName: 'Student',
          status: ticketStatus(t.status),
          priority: 'NORMAL',
          createdAt: t.createdAt ?? new Date().toISOString(),
          updatedAt: t.createdAt ?? new Date().toISOString(),
        })),
        topics: [],
      }
    },
  })

export const useUpdateTicket = (ticketId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: UpdateTicketRequest): Promise<Ticket> => {
      const status = vars.status === 'CLOSED' ? 'CLOSED' : vars.status === 'PENDING' ? 'IN_REVIEW' : 'OPEN'
      const row = await apiFetch<UnifaTicket>(`/api/v1/campus/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return {
        id: row.id,
        reference: row.id.slice(-8).toUpperCase(),
        subject: row.title ?? row.subject ?? row.type,
        fromName: 'Student',
        status: ticketStatus(row.status),
        priority: 'NORMAL',
        createdAt: row.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPORT_KEY })
    },
  })
}
