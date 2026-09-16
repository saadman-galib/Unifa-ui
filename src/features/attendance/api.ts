import { useQuery } from '@tanstack/react-query'
import { apiFetch, useMappedGet } from '@/hooks/use-api'
import {
  mapAttendanceAnalytics,
  mapAttendanceHistory,
  mapAttendanceOverview,
  mapCourseAttendance,
  mapDailyAttendance,
} from '@/lib/unifa'
import type {
  AttendanceAnalyticsResponse,
  AttendanceHistoryResponse,
  AttendanceOverviewResponse,
  CourseAttendanceResponse,
  DailyAttendanceResponse,
} from '@/types'
import type { UnifaAttendanceMy } from '@/types/unifa'

const KEY = ['attendance', 'my'] as const

export const useAttendanceOverview = () =>
  useMappedGet<UnifaAttendanceMy, AttendanceOverviewResponse>(
    '/api/v1/attendance/my',
    ['attendance', 'overview'],
    mapAttendanceOverview,
  )

export const useDailyAttendance = (date?: string) =>
  useQuery({
    queryKey: ['attendance', 'daily', date ?? 'today'],
    queryFn: async (): Promise<DailyAttendanceResponse> =>
      mapDailyAttendance(await apiFetch<UnifaAttendanceMy>('/api/v1/attendance/my'), date),
  })

export const useCourseAttendance = (courseId?: string) =>
  useQuery({
    queryKey: ['attendance', 'by-course', courseId ?? 'default'],
    queryFn: async (): Promise<CourseAttendanceResponse> =>
      mapCourseAttendance(await apiFetch<UnifaAttendanceMy>('/api/v1/attendance/my'), courseId),
  })

export const useAttendanceHistory = () =>
  useMappedGet<UnifaAttendanceMy, AttendanceHistoryResponse>(
    '/api/v1/attendance/my',
    ['attendance', 'history'],
    mapAttendanceHistory,
  )

export const useAttendanceAnalytics = () =>
  useMappedGet<UnifaAttendanceMy, AttendanceAnalyticsResponse>(
    '/api/v1/attendance/my',
    ['attendance', 'analytics'],
    mapAttendanceAnalytics,
  )

void KEY
