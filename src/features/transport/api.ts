import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { mapTransport } from '@/lib/unifa'
import { mapTicket } from '@/lib/unifa'
import type {
  CreateServiceRequestRequest,
  ServiceRequest,
  TransportOverviewResponse,
  TransportPaymentHistoryResponse,
} from '@/types/student'
import type { UnifaRoute, UnifaTicket } from '@/types/unifa'

export const useTransportOverview = () =>
  useQuery({
    queryKey: ['transport', 'overview'],
    queryFn: async (): Promise<TransportOverviewResponse> =>
      mapTransport(await apiFetch<UnifaRoute[]>('/api/v1/campus/transport/routes')),
  })

export const useTransportPayments = () =>
  useQuery({
    queryKey: ['transport', 'payments'],
    queryFn: async (): Promise<TransportPaymentHistoryResponse> => ({ payments: [] }),
  })

export const usePayTransportFee = () => {
  const queryClient = useQueryClient()
  return useMutation<{ summary: string; at: string }, ApiError, void>({
    mutationFn: async () => {
      const routes = await apiFetch<UnifaRoute[]>('/api/v1/campus/transport/routes')
      const route = routes[0]
      if (!route) throw new Error('No transport route is available.')
      const start = new Date()
      const end = new Date()
      end.setMonth(end.getMonth() + 4)
      await apiFetch('/api/v1/campus/transport/passes', {
        method: 'POST',
        body: JSON.stringify({
          routeId: route.id,
          validFrom: start.toISOString().slice(0, 10),
          validTo: end.toISOString().slice(0, 10),
        }),
      })
      return { summary: 'Transport pass requested.', at: new Date().toISOString() }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] })
    },
  })
}

export const useCreateTransportRequest = () =>
  useMutation({
    mutationFn: async (vars: CreateServiceRequestRequest): Promise<ServiceRequest> => {
      const row = await apiFetch<UnifaTicket>('/api/v1/campus/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'REQUEST',
          title: vars.subject,
          body: `Transport: ${vars.description}`,
        }),
      })
      return mapTicket(row)
    },
  })
