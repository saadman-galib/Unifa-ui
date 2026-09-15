import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/hooks/use-api'
import { displayName } from '@/lib/auth'
import { mapAdminDashboard, mapFacultyDashboard, mapStudentDashboard } from '@/lib/unifa'
import type { StudentDashboardResponse } from '@/types'
import type { FacultyDashboardResponse } from '@/types/faculty'
import type { AdminDashboardResponse } from '@/types/admin'
import type {
  UnifaAdminDashboard,
  UnifaAnnouncement,
  UnifaDepartment,
  UnifaFinanceReport,
  UnifaMe,
  UnifaStudentDashboard,
  UnifaTeacherDashboard,
} from '@/types/unifa'

export const useStudentDashboard = () =>
  useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async (): Promise<StudentDashboardResponse> => {
      const [dash, me] = await Promise.all([
        apiFetch<UnifaStudentDashboard>('/api/v1/dashboard/student'),
        apiFetch<UnifaMe>('/api/v1/auth/me').catch(() => null),
      ])
      return mapStudentDashboard(dash, me ? displayName(me).split(' ')[0] : 'there')
    },
  })

export const useFacultyDashboard = () =>
  useQuery({
    queryKey: ['faculty', 'dashboard'],
    queryFn: async (): Promise<FacultyDashboardResponse> =>
      mapFacultyDashboard(await apiFetch<UnifaTeacherDashboard>('/api/v1/dashboard/teacher')),
  })

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async (): Promise<AdminDashboardResponse> => {
      const [dash, announcements, departments, report] = await Promise.all([
        apiFetch<UnifaAdminDashboard>('/api/v1/dashboard/admin'),
        apiFetch<UnifaAnnouncement[]>('/api/v1/campus/announcements').catch(() => []),
        apiFetch<UnifaDepartment[]>('/api/v1/academic/departments').catch(() => []),
        apiFetch<UnifaFinanceReport>('/api/v1/finance/reports').catch(() => null),
      ])
      return mapAdminDashboard(dash, announcements, departments, report)
    },
  })
