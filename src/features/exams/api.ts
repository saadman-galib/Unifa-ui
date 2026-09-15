import { useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { displayName } from '@/lib/auth'
import {
  mapExamAnalytics,
  mapExamOverview,
  mapExamResults,
  mapExamSchedule,
  mapGradeReport,
} from '@/lib/unifa'
import type {
  AdmitCardResponse,
  CreateRevaluationRequest,
  ExamAnalyticsResponse,
  ExamAttendanceResponse,
  ExamOverviewResponse,
  ExamResultsResponse,
  ExamScheduleResponse,
  GradeReportResponse,
  RevaluationResponse,
  UpcomingExamsResponse,
} from '@/types'
import type { UnifaExam, UnifaExamResult, UnifaMe, UnifaTranscript } from '@/types/unifa'

async function exams() {
  return apiFetch<UnifaExam[]>('/api/v1/exams')
}

export const useExamOverview = () =>
  useQuery({
    queryKey: ['exams', 'overview'],
    queryFn: async (): Promise<ExamOverviewResponse> => mapExamOverview(await exams()),
  })

export const useExamSchedule = () =>
  useQuery({
    queryKey: ['exams', 'schedule'],
    queryFn: async (): Promise<ExamScheduleResponse> => mapExamSchedule(await exams()),
  })

export const useUpcomingExams = () =>
  useQuery({
    queryKey: ['exams', 'upcoming'],
    queryFn: async (): Promise<UpcomingExamsResponse> => {
      const { exams: slots } = mapExamSchedule(await exams())
      const now = Date.now()
      return { exams: slots.filter((s) => new Date(s.startsAt).getTime() > now) }
    },
  })

export const useAdmitCard = (termId?: string) =>
  useQuery({
    queryKey: ['exams', 'admit-card', termId ?? 'current'],
    queryFn: async (): Promise<AdmitCardResponse> => {
      const [me, schedule] = await Promise.all([
        apiFetch<UnifaMe>('/api/v1/auth/me'),
        exams().then(mapExamSchedule),
      ])
      return {
        card: {
          candidateName: displayName(me),
          registrationNo: me.student?.studentNo ?? '—',
          programme: me.student?.program.name ?? '—',
          department: me.student?.department.name ?? '—',
          examCenter: schedule.exams[0]?.venue ?? 'Main campus',
          issuedOn: new Date().toISOString().slice(0, 10),
          photoUrl: me.avatarUrl,
          qrData: me.student?.digitalId?.cardNumber ?? me.student?.studentNo ?? me.id,
          pdfUrl: '#',
        },
        blockedReason: null,
        exams: schedule.exams,
        readinessPercent: 100,
      }
    },
  })

export const useExamResults = (termId?: string) =>
  useQuery({
    queryKey: ['exams', 'results', termId ?? 'latest'],
    queryFn: async (): Promise<ExamResultsResponse> =>
      mapExamResults(await apiFetch<UnifaExamResult[]>('/api/v1/exams/my/results')),
  })

export const useGradeReport = () =>
  useQuery({
    queryKey: ['exams', 'grade-report'],
    queryFn: async (): Promise<GradeReportResponse> =>
      mapGradeReport(await apiFetch<UnifaTranscript>('/api/v1/academic/my/transcript')),
  })

export const useRevaluation = () =>
  useQuery({
    queryKey: ['exams', 'revaluation'],
    queryFn: async (): Promise<RevaluationResponse> => ({
      eligibleCourses: [],
      examTypes: [],
      reviewTypes: [],
      requests: [],
      windowClosesAt: null,
    }),
  })

export const useRequestRevaluation = () =>
  useMutation({
    mutationFn: async (_vars: CreateRevaluationRequest) => {
      throw new ApiError(400, { error: 'Revaluation requests are not available in UniFa yet.' })
    },
  })

export const useExamAttendanceSheet = () =>
  useQuery({
    queryKey: ['exams', 'attendance'],
    queryFn: async (): Promise<ExamAttendanceResponse> => {
      const { exams: slots, nextExamAt } = mapExamSchedule(await exams())
      const next = slots.find((s) => s.startsAt === nextExamAt) ?? slots[0] ?? null
      return {
        exam: next,
        entries: next
          ? [
              { id: 'arrive', label: 'Arrived', at: null, done: false },
              { id: 'id', label: 'ID checked', at: null, done: false },
            ]
          : [],
      }
    },
  })

export const useExamAnalytics = () =>
  useQuery({
    queryKey: ['exams', 'analytics'],
    queryFn: async (): Promise<ExamAnalyticsResponse> =>
      mapExamAnalytics(await apiFetch<UnifaExamResult[]>('/api/v1/exams/my/results')),
  })
