import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import { mapCertificates } from '@/lib/unifa'
import type { CertificatesResponse, PrintOrder, PrintOrderRequest } from '@/types'
import type { UnifaCertificate } from '@/types/unifa'

export const useCertificates = () =>
  useQuery({
    queryKey: ['certificates'],
    queryFn: async (): Promise<CertificatesResponse> =>
      mapCertificates(await apiFetch<UnifaCertificate[]>('/api/v1/campus/certificates')),
  })

export const useOrderPrints = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: PrintOrderRequest): Promise<PrintOrder> => {
      await apiFetch('/api/v1/campus/certificates', {
        method: 'POST',
        body: JSON.stringify({ type: vars.certificateIds[0] ?? 'TRANSCRIPT' }),
      })
      return {
        id: crypto.randomUUID(),
        status: 'PENDING',
        fee: '0',
        createdAt: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}
