import { useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { mapBorrowed, mapLibrary } from '@/lib/unifa'
import type {
  BookAcquisitionRequest,
  LibraryFeedbackRequest,
  LibraryHistoryResponse,
  LibraryOverviewResponse,
  MyBorrowedBooksResponse,
  RenewLoanResult,
} from '@/types/student'
import type { UnifaBook } from '@/types/unifa'

export const useLibraryOverview = (q: string, category: string) =>
  useQuery({
    queryKey: ['library', 'overview', q, category],
    queryFn: async (): Promise<LibraryOverviewResponse> => {
      const mapped = mapLibrary(await apiFetch<UnifaBook[]>('/api/v1/campus/library/books'))
      const needle = q.trim().toLowerCase()
      const catalog = mapped.catalog.filter((b) => {
        if (category && category !== 'ALL' && b.category !== category) return false
        if (!needle) return true
        return `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(needle)
      })
      return { ...mapped, catalog }
    },
  })

export const useMyBorrowedBooks = () =>
  useQuery({
    queryKey: ['library', 'borrowed'],
    queryFn: async (): Promise<MyBorrowedBooksResponse> => mapBorrowed(),
  })

export const useRenewLoan = () =>
  useMutation({
    mutationFn: async (_loanId: string): Promise<RenewLoanResult> => {
      throw new ApiError(400, { error: 'Students cannot renew loans in UniFa — ask library staff.' })
    },
  })

export const useLibraryHistory = () =>
  useQuery({
    queryKey: ['library', 'history'],
    queryFn: async (): Promise<LibraryHistoryResponse> => mapBorrowed(),
  })

export const usePayLibraryFines = () =>
  useMutation<{ summary: string; at: string }, ApiError, void>({
    mutationFn: async () => {
      throw new ApiError(400, { error: 'Library fines are settled by staff in UniFa.' })
    },
  })

export const useAcquisitionRequest = () =>
  useMutation({
    mutationFn: async (vars: BookAcquisitionRequest) => {
      await apiFetch('/api/v1/campus/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'REQUEST',
          title: `Book request: ${vars.title}`,
          body: `${vars.reason}\nAuthor: ${vars.author}\nISBN: ${vars.isbn ?? 'n/a'}`,
        }),
      })
      return { summary: 'Acquisition request submitted.', at: new Date().toISOString() }
    },
  })

export const useLibraryFeedback = () =>
  useMutation({
    mutationFn: async (vars: LibraryFeedbackRequest) => {
      await apiFetch('/api/v1/campus/tickets', {
        method: 'POST',
        body: JSON.stringify({
          type: 'COMPLAINT',
          title: vars.subject,
          body: `${vars.topic}: ${vars.description}`,
        }),
      })
      return { summary: 'Feedback submitted.', at: new Date().toISOString() }
    },
  })
