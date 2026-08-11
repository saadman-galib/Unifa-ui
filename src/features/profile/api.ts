import { useGetData, useOptimistic, usePatchData, usePostData } from '@/hooks/use-api'
import type {
  ChangePasswordRequest,
  ProfileDocument,
  ProfileResponse,
  SecurityResponse,
  UpdateProfileRequest,
} from '@/types/student'

/**
 * My Profile (5 screens). Contract: docs/api/student.md §Profile.
 *
 * One GET covers all 4 tab routes — screen-shaped like every other module,
 * see docs/api/student.md §2.1. Security lives on its own GET/mutations
 * since it is a separate drill-in, not a tab.
 */

const PROFILE_KEY = ['student', 'profile']

export const useProfile = () => useGetData<ProfileResponse>('/api/student/profile/', PROFILE_KEY)

/**
 * Optimistic — contact/address/emergency-contact fields, instantly
 * reversible. The server still owns the rest: anything outside the
 * self-editable subset comes back 403 rather than being silently dropped.
 */
export const useUpdateProfile = () => {
  const patch = useOptimistic<ProfileResponse, UpdateProfileRequest>(
    PROFILE_KEY,
    (prev, vars) => ({ ...prev, ...vars }),
  )
  return usePatchData<ProfileResponse, UpdateProfileRequest>('/api/student/profile/', PROFILE_KEY, patch)
}

/** Multipart — the browser owns the boundary, so never set Content-Type. */
export const useUploadPhoto = () =>
  usePostData<{ avatarUrl: string | null }, FormData>('/api/student/profile/photo/', PROFILE_KEY)

export const useUploadDocument = () =>
  usePostData<ProfileDocument, FormData>('/api/student/profile/documents/', PROFILE_KEY)

export const useSecurity = () =>
  useGetData<SecurityResponse>('/api/student/profile/security/', ['student', 'profile', 'security'])

export const useChangePassword = () =>
  usePostData<{ summary: string; at: string }, ChangePasswordRequest>(
    '/api/student/profile/security/password/',
    ['student', 'profile', 'security'],
  )

export const useRevokeOtherSessions = () =>
  usePostData<{ summary: string; at: string }, void>(
    '/api/student/profile/security/sessions/revoke-others/',
    ['student', 'profile', 'security'],
  )
