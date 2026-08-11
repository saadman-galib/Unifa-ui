import { useGetData, usePostData } from '@/hooks/use-api'
import type {
  BookAcquisitionRequest,
  LibraryFeedbackRequest,
  LibraryHistoryResponse,
  LibraryOverviewResponse,
  MyBorrowedBooksResponse,
  RenewLoanResult,
} from '@/types/student'

/**
 * Library module data (4 screens). Contract: mock/server.ts `/api/student/library/*`.
 *
 * Fine payments are a real charge, not optimistic — same money rule as
 * finance, see docs/api/student.md §5.3: show pending state, wait for the
 * server to confirm before the balance moves.
 */

export const useLibraryOverview = (q: string, category: string) => {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category && category !== 'ALL') params.set('category', category)
  const qs = params.toString()

  return useGetData<LibraryOverviewResponse>(`/api/student/library/${qs ? `?${qs}` : ''}`, [
    'library',
    'overview',
    q,
    category,
  ])
}

const BORROWED_KEY = ['library', 'borrowed']

export const useMyBorrowedBooks = () =>
  useGetData<MyBorrowedBooksResponse>('/api/student/library/borrowed/', BORROWED_KEY)

export const useRenewLoan = () =>
  usePostData<RenewLoanResult, string>(
    (loanId) => `/api/student/library/borrowed/${loanId}/renew/`,
    BORROWED_KEY,
  )

const HISTORY_KEY = ['library', 'history']

export const useLibraryHistory = () =>
  useGetData<LibraryHistoryResponse>('/api/student/library/history/', HISTORY_KEY)

export const usePayLibraryFines = () =>
  usePostData<{ summary: string; at: string }, void>('/api/student/library/fines/pay/', HISTORY_KEY)

export const useAcquisitionRequest = () =>
  usePostData<{ summary: string; at: string }, BookAcquisitionRequest>(
    '/api/student/library/acquisition-requests/',
    ['library'],
  )

export const useLibraryFeedback = () =>
  usePostData<{ summary: string; at: string }, LibraryFeedbackRequest>(
    '/api/student/library/feedback/',
    ['library'],
  )
