import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

import { clearTokens, getAccessToken } from '@/lib/auth'
import type { Envelope, Problem } from '@/types/common'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

/**
 * A non-2xx response. UniFa sends `{ error, details? }`; older mocks sent
 * RFC 7807. Both are normalised into `Problem` so screens can keep using
 * `detail` / `fieldError`.
 */
export class ApiError extends Error {
  status: number
  problem: Problem

  constructor(status: number, body: unknown) {
    const problem = toProblem(status, body)
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  get code(): string | undefined {
    return this.problem.code
  }

  get detail(): string | undefined {
    return this.problem.detail
  }

  fieldError(field: string): string | undefined {
    return this.problem.errors?.find((e) => e.field === field)?.detail
  }
}

type UnifaErrorBody = {
  error?: unknown
  details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | unknown
}

function unifaFieldErrors(details: UnifaErrorBody['details']): Problem['errors'] {
  if (!details || typeof details !== 'object' || !('fieldErrors' in details)) return undefined
  const fields = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors
  if (!fields) return undefined
  return Object.entries(fields).flatMap(([field, msgs]) =>
    (msgs ?? []).map((detail) => ({ field, code: 'invalid', detail })),
  )
}

function toProblem(status: number, body: unknown): Problem {
  if (body && typeof body === 'object' && 'title' in body && 'status' in body) {
    return body as Problem
  }
  if (body && typeof body === 'object' && 'error' in body) {
    const raw = body as UnifaErrorBody
    const error = typeof raw.error === 'string' ? raw.error : `Request failed with ${status}`
    const form =
      raw.details && typeof raw.details === 'object' && 'formErrors' in raw.details
        ? (raw.details as { formErrors?: string[] }).formErrors?.[0]
        : undefined
    return {
      type: 'about:blank',
      title: error,
      status,
      detail: form ?? error,
      errors: unifaFieldErrors(raw.details),
    }
  }
  return {
    type: 'about:blank',
    title: `Request failed with ${status}`,
    status,
    detail: typeof body === 'string' && body ? body : undefined,
  }
}

/**
 * Strip a success envelope when present. UniFa returns bare JSON, so this is
 * a no-op for live responses and still unwraps the old mock envelope.
 */
export function unwrap<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object' || !('data' in raw) || !('meta' in raw)) {
    return raw as T
  }
  const { data, meta } = raw as Envelope<unknown>
  if (meta?.pagination) {
    if (Array.isArray(data)) return { ...meta.pagination, results: data } as T
    if (data && typeof data === 'object' && 'results' in data) {
      return { ...data, ...meta.pagination } as T
    }
  }
  return data as T
}

export const AUTH_EXPIRED_EVENT = 'unigpt:auth-expired'

function buildInit(init: RequestInit | undefined, token: string | null): RequestInit {
  const isMultipart = init?.body instanceof FormData

  return {
    ...init,
    headers: {
      ...(init?.body && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  }
}

/**
 * Thin fetch wrapper: JSON in, unwrapped `data` out, throws ApiError on
 * non-2xx. UniFa has no refresh token — a 401 ends the session.
 */
export async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const token = getAccessToken()
  const res = await fetch(url, buildInit(init, token))

  if (res.status === 401 && token) {
    clearTokens()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body)
  return unwrap<T>(body)
}

type QueryOpts<T> = Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
type MutationOpts<TData, TVars> = Omit<UseMutationOptions<TData, ApiError, TVars>, 'mutationFn'>

export function useGetData<T>(endpoint: string, key: unknown[], options?: QueryOpts<T>) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: () => apiFetch<T>(endpoint),
    ...options,
  })
}

/** GET then map UniFa's resource payload onto a screen-shaped type. */
export function useMappedGet<TRaw, T>(
  endpoint: string,
  key: unknown[],
  map: (raw: TRaw) => T,
  options?: QueryOpts<T>,
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: async () => map(await apiFetch<TRaw>(endpoint)),
    ...options,
  })
}

function useApiMutation<TData, TVars>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string | ((vars: TVars) => string),
  key: unknown[],
  options?: MutationOpts<TData, TVars>,
) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options ?? {}

  return useMutation<TData, ApiError, TVars>({
    mutationFn: (vars: TVars) =>
      apiFetch<TData>(typeof endpoint === 'function' ? endpoint(vars) : endpoint, {
        method,
        body:
          method === 'DELETE'
            ? undefined
            : vars instanceof FormData
              ? vars
              : JSON.stringify(vars),
      }),
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: key })
      onSuccess?.(...args)
    },
    ...rest,
  })
}

export function usePostData<TData = unknown, TVars = unknown>(
  endpoint: string | ((vars: TVars) => string),
  key: unknown[],
  options?: MutationOpts<TData, TVars>,
) {
  return useApiMutation<TData, TVars>('POST', endpoint, key, options)
}

export function usePutData<TData = unknown, TVars = unknown>(
  endpoint: string | ((vars: TVars) => string),
  key: unknown[],
  options?: MutationOpts<TData, TVars>,
) {
  return useApiMutation<TData, TVars>('PUT', endpoint, key, options)
}

export function usePatchData<TData = unknown, TVars = unknown>(
  endpoint: string | ((vars: TVars) => string),
  key: unknown[],
  options?: MutationOpts<TData, TVars>,
) {
  return useApiMutation<TData, TVars>('PATCH', endpoint, key, options)
}

export function useOptimistic<TCached, TVars>(
  key: unknown[],
  patch: (previous: TCached, vars: TVars) => TCached,
) {
  const queryClient = useQueryClient()

  return {
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<TCached>(key)
      if (previous !== undefined) {
        queryClient.setQueryData<TCached>(key, patch(previous, vars))
      }
      return { previous }
    },
    onError: (_err: ApiError, _vars: TVars, snapshot: unknown) => {
      const previous = (snapshot as { previous?: TCached } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(key, previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  }
}

export function useDelete<TData = unknown, TVars = unknown>(
  endpoint: string | ((vars: TVars) => string),
  key: unknown[],
  options?: MutationOpts<TData, TVars>,
) {
  return useApiMutation<TData, TVars>('DELETE', endpoint, key, options)
}
