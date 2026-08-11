import { useGetData, usePostData } from '@/hooks/use-api'
import type {
  CreateServiceRequestRequest,
  ServiceRequest,
  TransportOverviewResponse,
  TransportPaymentHistoryResponse,
} from '@/types/student'

/** Transport module data (4 screens). Contract: docs/api/student.md (Transport). */

export const useTransportOverview = () =>
  useGetData<TransportOverviewResponse>('/api/student/transport/', ['transport', 'overview'])

export const useTransportPayments = () =>
  useGetData<TransportPaymentHistoryResponse>('/api/student/transport/payments/', [
    'transport',
    'payments',
  ])

/**
 * Pays the first non-PAID entry server-side. Not optimistic — this moves
 * money, see docs/api/student.md §5.3. Invalidates the whole `transport`
 * tree: the payment ledger and the overview's fee summary both move.
 */
export const usePayTransportFee = () =>
  usePostData<{ summary: string; at: string }, void>('/api/student/transport/payments/pay/', [
    'transport',
  ])

/**
 * POST-only here: the 4 named Transport routes have no request-history view,
 * so the GET hook is skipped (per the brief) rather than built speculatively.
 */
export const useCreateTransportRequest = () =>
  usePostData<ServiceRequest, CreateServiceRequestRequest>('/api/student/transport/requests/', [
    'transport',
    'requests',
  ])
