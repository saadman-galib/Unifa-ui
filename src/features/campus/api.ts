import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import type {
  UnifaClub,
  UnifaDigitalId,
  UnifaJob,
  UnifaAnnouncement,
  UnifaNotification,
  UnifaMe,
} from '@/types/unifa'

export const useClubs = () =>
  useQuery({
    queryKey: ['campus', 'clubs'],
    queryFn: () => apiFetch<UnifaClub[]>('/api/v1/campus/clubs'),
  })

export const useJoinClub = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clubId: string) =>
      apiFetch(`/api/v1/campus/clubs/${clubId}/join`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campus', 'clubs'] })
    },
  })
}

export const useDigitalId = () =>
  useQuery({
    queryKey: ['campus', 'digital-id'],
    queryFn: async () => {
      const [card, me] = await Promise.all([
        apiFetch<UnifaDigitalId | null>('/api/v1/campus/digital-id'),
        apiFetch<UnifaMe>('/api/v1/auth/me'),
      ])
      return { card, me }
    },
  })

export const useJobs = () =>
  useQuery({
    queryKey: ['campus', 'jobs'],
    queryFn: () => apiFetch<UnifaJob[]>('/api/v1/campus/jobs'),
  })

export const useApplyJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { jobId: string; coverNote: string }) =>
      apiFetch(`/api/v1/campus/jobs/${vars.jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ coverNote: vars.coverNote }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campus', 'jobs'] })
    },
  })
}

export const useSaveCv = () =>
  useMutation({
    mutationFn: (vars: { headline: string; summary: string; skills: string[]; fileUrl?: string }) =>
      apiFetch('/api/v1/campus/cv', { method: 'PUT', body: JSON.stringify(vars) }),
  })

export const useAnnouncements = () =>
  useQuery({
    queryKey: ['campus', 'announcements'],
    queryFn: () => apiFetch<UnifaAnnouncement[]>('/api/v1/campus/announcements'),
  })

export const useNotifications = () =>
  useQuery({
    queryKey: ['campus', 'notifications'],
    queryFn: () => apiFetch<UnifaNotification[]>('/api/v1/campus/notifications'),
  })

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/campus/notifications/${id}/read`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campus', 'notifications'] })
    },
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (vars: { currentPassword: string; newPassword: string }) =>
      apiFetch<{ ok: true }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
  })
