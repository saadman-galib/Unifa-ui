import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import { mapServices, mapTicket } from '@/lib/unifa'
import type {
  CreateServiceRequestRequest,
  ServiceRequest,
  ServiceRequestsResponse,
  StudentServicesResponse,
} from '@/types/student'
import type { UnifaTicket } from '@/types/unifa'

const tickets = () => apiFetch<UnifaTicket[]>('/api/v1/campus/tickets')

export const useStudentServices = () =>
  useQuery({
    queryKey: ['services', 'dashboard'],
    queryFn: async (): Promise<StudentServicesResponse> => mapServices(await tickets()),
  })

export const useServiceRequests = (status: string) =>
  useQuery({
    queryKey: ['services', 'requests', status],
    queryFn: async (): Promise<ServiceRequestsResponse> => {
      const mapped = (await tickets()).map(mapTicket)
      const requests =
        status && status !== 'ALL' ? mapped.filter((r) => r.status === status) : mapped
      return { requests }
    },
  })

export const useServiceRequestDetail = (id: string) =>
  useQuery({
    queryKey: ['services', 'requests', 'detail', id],
    queryFn: async (): Promise<ServiceRequest> => {
      const found = (await tickets()).map(mapTicket).find((t) => t.id === id)
      if (!found) throw new Error('Request not found')
      return found
    },
  })

export const useCreateServiceRequest = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: CreateServiceRequestRequest): Promise<ServiceRequest> => {
      const row = await apiFetch<UnifaTicket>('/api/v1/campus/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'REQUEST',
          title: vars.subject,
          body: `${vars.category} (${vars.priority}): ${vars.description}`,
        }),
      })
      return mapTicket(row)
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['services'] })
      void navigate(`/student/services/${data.id}`)
    },
  })
}
