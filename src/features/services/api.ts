import { useNavigate } from 'react-router'
import { useGetData, usePostData } from '@/hooks/use-api'
import type {
  CreateServiceRequestRequest,
  ServiceRequest,
  ServiceRequestsResponse,
  StudentServicesResponse,
} from '@/types/student'

/** Student Services module data. Contract: docs/api/student.md (Student Services). */

export const useStudentServices = () =>
  useGetData<StudentServicesResponse>('/api/student/services/', ['services', 'dashboard'])

export const useServiceRequests = (status: string) => {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.set('status', status)
  const qs = params.toString()

  return useGetData<ServiceRequestsResponse>(
    `/api/student/services/requests/${qs ? `?${qs}` : ''}`,
    ['services', 'requests', status],
  )
}

export const useServiceRequestDetail = (id: string) =>
  useGetData<ServiceRequest>(`/api/student/services/requests/${id}/`, ['services', 'requests', 'detail', id])

/**
 * Not optimistic: the server assigns the reference/id, so there is nothing
 * honest to render until it answers. Navigates to the new request on success.
 */
export const useCreateServiceRequest = () => {
  const navigate = useNavigate()

  return usePostData<ServiceRequest, CreateServiceRequestRequest>(
    '/api/student/services/requests/',
    ['services'],
    {
      onSuccess: (data) => {
        void navigate(`/student/services/${data.id}`)
      },
    },
  )
}
