import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { mapHostel, mapTicket } from '@/lib/unifa'
import type {
  CreateServiceRequestRequest,
  HostelLedgerResponse,
  HostelOverviewResponse,
  ServiceRequest,
} from '@/types/student'
import type { UnifaHostel, UnifaTicket } from '@/types/unifa'

export const useHostelOverview = () =>
  useQuery({
    queryKey: ['hostel', 'overview'],
    queryFn: async (): Promise<HostelOverviewResponse> =>
      mapHostel(await apiFetch<UnifaHostel[]>('/api/v1/campus/hostels')),
  })

export const useHostelLedger = () =>
  useQuery({
    queryKey: ['hostel', 'ledger'],
    queryFn: async (): Promise<HostelLedgerResponse> => ({ payments: [] }),
  })

export const usePayHostelFee = () =>
  useMutation<{ summary: string; at: string }, ApiError, { paymentId: string }>({
    mutationFn: async () => {
      throw new ApiError(400, { error: 'Hostel fees are billed through Finance invoices in UniFa.' })
    },
  })

export const useCreateHostelRequest = () => {
  const queryClient = useQueryClient()
  return useMutation<ServiceRequest, ApiError, CreateServiceRequestRequest>({
    mutationFn: async (vars: CreateServiceRequestRequest): Promise<ServiceRequest> => {
      const row = await apiFetch<UnifaTicket>('/api/v1/campus/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'REQUEST',
          title: vars.subject,
          body: `Hostel: ${vars.description}`,
        }),
      })
      return mapTicket(row)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hostel'] })
    },
  })
}
