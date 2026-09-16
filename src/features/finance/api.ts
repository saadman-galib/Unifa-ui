import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import {
  mapFeeStatement,
  mapFinanceOverview,
  mapInstallments,
  mapInvoices,
  mapPaymentHistory,
  mapPaymentIntent,
  mapPaymentOptions,
} from '@/lib/unifa'
import type {
  CreatePaymentRequest,
  FeeStatementResponse,
  FinanceOverviewResponse,
  InstallmentsResponse,
  InvoicesResponse,
  PaymentHistoryResponse,
  PaymentIntent,
  PaymentOptionsResponse,
} from '@/types'
import type { UnifaInvoice, UnifaMe, UnifaPayment } from '@/types/unifa'

const invoices = () => apiFetch<UnifaInvoice[]>('/api/v1/finance/invoices')

export const useFinanceOverview = () =>
  useQuery({
    queryKey: ['finance', 'overview'],
    queryFn: async (): Promise<FinanceOverviewResponse> => mapFinanceOverview(await invoices()),
  })

export const usePaymentOptions = () =>
  useQuery({
    queryKey: ['finance', 'pay'],
    queryFn: async (): Promise<PaymentOptionsResponse> => mapPaymentOptions(await invoices()),
  })

export const useCreatePayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: CreatePaymentRequest): Promise<PaymentIntent> => {
      const invoiceId = vars.invoiceIds[0]
      const pay = await apiFetch<UnifaPayment>(`/api/v1/finance/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          gateway: vars.methodId,
          amount: Number(vars.amount),
        }),
      })
      return mapPaymentIntent(pay)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['finance'] })
      void queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
    },
  })
}

export const usePaymentIntent = (id: string | null) =>
  useQuery({
    queryKey: ['finance', 'payment', id],
    enabled: id !== null,
    queryFn: async (): Promise<PaymentIntent> => {
      const all = await invoices()
      const payment = all.flatMap((i) => i.payments).find((p) => p.id === id)
      if (!payment) {
        return {
          id: id ?? '',
          status: 'SUCCESS',
          amount: '0',
          currency: 'BDT',
          redirectUrl: null,
          reference: id,
          failureReason: null,
          createdAt: new Date().toISOString(),
        }
      }
      return mapPaymentIntent(payment)
    },
  })

export const useFeeStatement = (termId?: string) =>
  useQuery({
    queryKey: ['finance', 'statement', termId ?? 'current'],
    queryFn: async (): Promise<FeeStatementResponse> => {
      const [rows, me] = await Promise.all([
        invoices(),
        apiFetch<UnifaMe>('/api/v1/auth/me').catch(() => null),
      ])
      return mapFeeStatement(rows, me)
    },
  })

export const useInvoices = () =>
  useQuery({
    queryKey: ['finance', 'invoices'],
    queryFn: async (): Promise<InvoicesResponse> => mapInvoices(await invoices()),
  })

export const useInstallments = () =>
  useQuery({
    queryKey: ['finance', 'installments'],
    queryFn: async (): Promise<InstallmentsResponse> => mapInstallments(await invoices()),
  })

export const usePaymentHistory = () =>
  useQuery({
    queryKey: ['finance', 'history'],
    queryFn: async (): Promise<PaymentHistoryResponse> => mapPaymentHistory(await invoices()),
  })
