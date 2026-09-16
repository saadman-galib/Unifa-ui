import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError, useMappedGet } from '@/hooks/use-api'
import { mapProfile } from '@/lib/unifa'
import type {
  ChangePasswordRequest,
  ProfileDocument,
  ProfileResponse,
  SecurityResponse,
  UpdateProfileRequest,
} from '@/types/student'
import type { UnifaMe } from '@/types/unifa'

const PROFILE_KEY = ['student', 'profile']

export const useProfile = () =>
  useMappedGet<UnifaMe, ProfileResponse>('/api/v1/auth/me', PROFILE_KEY, mapProfile)

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (_vars: UpdateProfileRequest): Promise<ProfileResponse> => {
      throw new ApiError(400, { error: 'Contact details are owned by the registrar in UniFa.' })
    },
  })

export const useUploadPhoto = () =>
  useMutation({
    mutationFn: async (_form: FormData): Promise<{ avatarUrl: string | null }> => {
      throw new ApiError(400, { error: 'Photo upload is not available on the UniFa API yet.' })
    },
  })

export const useUploadDocument = () =>
  useMutation({
    mutationFn: async (_form: FormData): Promise<ProfileDocument> => {
      throw new ApiError(400, { error: 'Document upload is not available on the UniFa API yet.' })
    },
  })

export const useSecurity = () =>
  useQuery({
    queryKey: ['student', 'profile', 'security'],
    queryFn: async (): Promise<SecurityResponse> => {
      const me = await apiFetch<UnifaMe>('/api/v1/auth/me')
      return {
        twoFactorEnabled: false,
        smsRecoveryPhone: me.phone,
        authenticatorConfigured: false,
        sessions: [],
      }
    },
  })

export const useChangePassword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: ChangePasswordRequest) => {
      await apiFetch<{ ok: true }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(vars),
      })
      return { summary: 'Your password has been updated.', at: new Date().toISOString() }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student', 'profile', 'security'] })
    },
  })
}

export const useRevokeOtherSessions = () =>
  useMutation<{ summary: string; at: string }, ApiError, void>({
    mutationFn: async () => {
      throw new ApiError(400, { error: 'Session revoke is not available on the UniFa API yet.' })
    },
  })
