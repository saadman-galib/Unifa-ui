import { useGetData, usePostData } from '@/hooks/use-api'
import type {
  CreateServiceRequestRequest,
  HostelLedgerResponse,
  HostelOverviewResponse,
  ServiceRequest,
} from '@/types/student'

/** Hostel module data. Contract: docs/api/student.md (Hostel). */

/** Also backs the Room Details screen — same payload, no separate endpoint. */
export const useHostelOverview = () =>
  useGetData<HostelOverviewResponse>('/api/student/hostel/', ['hostel', 'overview'])

export const useHostelLedger = () =>
  useGetData<HostelLedgerResponse>('/api/student/hostel/ledger/', ['hostel', 'ledger'])

/** Not optimistic — a real payment action. See docs/api/use-api.ts `useOptimistic` note. */
export const usePayHostelFee = () =>
  usePostData<{ summary: string; at: string }, { paymentId: string }>(
    '/api/student/hostel/ledger/pay/',
    ['hostel', 'ledger'],
  )

/** Not optimistic — the server assigns the reference, so there is nothing honest to render early. */
export const useCreateHostelRequest = () =>
  usePostData<ServiceRequest, CreateServiceRequestRequest>('/api/student/hostel/requests/', [
    'hostel',
    'requests',
  ])
