import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import {
  mapAnnouncements,
  mapAssignments,
  mapLmsFromEnrollments,
  mapLmsGradebook,
  mapMaterials,
  mapQuiz,
  mapQuizAttempt,
  mapQuizzes,
} from '@/lib/unifa'
import type {
  AnnouncementsResponse,
  AssignmentDetailResponse,
  AssignmentsResponse,
  CreateNoteRequest,
  CreateReplyRequest,
  Cursored,
  DownloadsResponse,
  ForumThread,
  ForumThreadDetailResponse,
  GradebookResponse,
  LearningAnalyticsResponse,
  LearningProgressResponse,
  LecturesResponse,
  LiveClassesResponse,
  LmsCoursesResponse,
  LmsOverviewResponse,
  MaterialsResponse,
  Note,
  Paginated,
  PracticeQuizResponse,
  QuizAttemptRequest,
  QuizAttemptResult,
  QuizzesResponse,
  RecordingsResponse,
  Submission,
} from '@/types'
import type { UnifaAnnouncement, UnifaAssignment, UnifaEnrollment, UnifaMaterial, UnifaQuiz } from '@/types/unifa'

const enrollments = () => apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments')

export const useLmsOverview = () =>
  useQuery({
    queryKey: ['lms', 'overview'],
    queryFn: async (): Promise<LmsOverviewResponse> => mapLmsFromEnrollments(await enrollments()),
  })

export const useLmsCourses = () =>
  useQuery({
    queryKey: ['lms', 'courses'],
    queryFn: async (): Promise<LmsCoursesResponse> => mapLmsFromEnrollments(await enrollments()),
  })

export const useLectures = (courseId: string) =>
  useQuery({
    queryKey: ['lms', 'lectures', courseId],
    queryFn: async (): Promise<LecturesResponse> => ({
      courseId,
      moduleTitle: 'Lectures',
      summary: 'Recorded lectures are not on the UniFa API. Course files live under Materials.',
      lectures: [],
    }),
  })

export const useMaterials = (courseId: string) =>
  useQuery({
    queryKey: ['lms', 'materials', courseId],
    queryFn: async (): Promise<MaterialsResponse> => {
      const mine = await enrollments()
      const match = mine.find((e) => e.section.course.id === courseId) ?? mine.find((e) => e.section.id === courseId)
      if (!match) return mapMaterials(courseId, [])
      const rows = await apiFetch<UnifaMaterial[]>(`/api/v1/lms/sections/${match.section.id}/materials`)
      return mapMaterials(courseId, rows)
    },
  })

export const useAssignments = () =>
  useQuery({
    queryKey: ['lms', 'assignments'],
    queryFn: async (): Promise<AssignmentsResponse> => {
      const mine = await enrollments()
      const rows = await Promise.all(
        mine.map(async (enrollment) => {
          const list = await apiFetch<UnifaAssignment[]>(
            `/api/v1/lms/sections/${enrollment.section.id}/assignments`,
          ).catch(() => [] as UnifaAssignment[])
          return list.map((assignment) => ({ assignment, enrollment }))
        }),
      )
      return mapAssignments(rows.flat())
    },
  })

export const useAssignmentDetail = (id: string) =>
  useQuery({
    queryKey: ['lms', 'assignments', id],
    queryFn: async (): Promise<AssignmentDetailResponse> => {
      const mapped = await fetchAssignments()
      const assignment = mapped.assignments.find((a) => a.id === id)
      if (!assignment) throw new ApiError(404, { error: 'Assignment not found' })
      return {
        id: assignment.id,
        title: assignment.title,
        course: assignment.course,
        dueAt: assignment.dueAt,
        brief: assignment.summary,
        requirements: [],
        integrityNote: 'Submit your own work.',
        maxAttachments: 3,
        maxAttachmentBytes: 10_000_000,
        acceptedMimeTypes: ['application/pdf', 'application/zip'],
        submission: assignment.submittedAt
          ? {
              id: assignment.id,
              assignmentId: assignment.id,
              state: assignment.state === 'GRADED' ? 'GRADED' : 'SUBMITTED',
              comment: '',
              attachments: [],
              submittedAt: assignment.submittedAt,
              grade: assignment.grade,
              feedback: null,
            }
          : null,
      }
    },
  })

async function fetchAssignments() {
  const mine = await enrollments()
  const rows = await Promise.all(
    mine.map(async (enrollment) => {
      const list = await apiFetch<UnifaAssignment[]>(
        `/api/v1/lms/sections/${enrollment.section.id}/assignments`,
      ).catch(() => [] as UnifaAssignment[])
      return list.map((assignment) => ({ assignment, enrollment }))
    }),
  )
  return mapAssignments(rows.flat())
}

export const useSubmitAssignment = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: FormData): Promise<Submission> => {
      const file = form.get('file')
      const fileUrl = typeof form.get('fileUrl') === 'string' ? String(form.get('fileUrl')) : undefined
      const content = typeof form.get('content') === 'string' ? String(form.get('content')) : undefined
      // UniFa accepts a URL, not multipart. If the student pasted a URL in the form, use it.
      const url =
        fileUrl ??
        (typeof file === 'string' ? file : 'https://example.com/submission')
      const row = await apiFetch<{ id: string; submittedAt?: string }>(`/api/v1/lms/assignments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ fileUrl: url, content: content ?? 'Submitted from the portal' }),
      })
      return {
        id: row.id,
        assignmentId: id,
        state: 'SUBMITTED',
        comment: content ?? '',
        attachments: [],
        submittedAt: row.submittedAt ?? new Date().toISOString(),
        grade: null,
        feedback: null,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lms', 'assignments'] })
    },
  })
}

export const useQuizzes = () =>
  useQuery({
    queryKey: ['lms', 'quizzes'],
    queryFn: async (): Promise<QuizzesResponse> => mapQuizzes(),
  })

export const usePracticeQuiz = (id: string) =>
  useQuery({
    queryKey: ['lms', 'practice', id],
    queryFn: async (): Promise<PracticeQuizResponse> =>
      mapQuiz(await apiFetch<UnifaQuiz>(`/api/v1/lms/quizzes/${id}`)),
  })

export const useSubmitQuizAttempt = (id: string) =>
  useMutation({
    mutationFn: async (vars: QuizAttemptRequest): Promise<QuizAttemptResult> => {
      const attempt = await apiFetch<{ id: string; score: number }>(`/api/v1/lms/quizzes/${id}/attempt`, {
        method: 'POST',
        body: JSON.stringify({
          answers: vars.answers.map((a) => ({ questionId: a.questionId, answer: a.optionId })),
        }),
      })
      return mapQuizAttempt(Number(attempt.score), vars.answers.length)
    },
  })

export const useLiveClasses = () =>
  useQuery({
    queryKey: ['lms', 'live'],
    queryFn: async (): Promise<LiveClassesResponse> => ({ live: [], upcoming: [] }),
  })

export const useRecordings = () =>
  useQuery({
    queryKey: ['lms', 'recordings'],
    queryFn: async (): Promise<RecordingsResponse> => ({
      metrics: [],
      tip: 'Recordings are not stored in UniFa yet.',
      sessions: [],
    }),
  })

export const useDownloads = () =>
  useQuery({
    queryKey: ['lms', 'downloads'],
    queryFn: async (): Promise<DownloadsResponse> => {
      const mine = await enrollments()
      const files = (
        await Promise.all(
          mine.map(async (e) => {
            const rows = await apiFetch<UnifaMaterial[]>(`/api/v1/lms/sections/${e.section.id}/materials`).catch(
              () => [] as UnifaMaterial[],
            )
            return rows.map((m) => ({
              id: m.id,
              filename: m.title,
              course: { id: e.section.course.id, code: e.section.course.code, title: e.section.course.title, credits: e.section.course.credits },
              sizeBytes: 0,
              state: 'READY' as const,
              url: m.url,
              expiresAt: null,
            }))
          }),
        )
      ).flat()
      return { files }
    },
  })

export const useForumThreads = (_courseId?: string) =>
  useQuery({
    queryKey: ['lms', 'forum', _courseId ?? 'all'],
    queryFn: async (): Promise<Cursored<ForumThread>> => ({ results: [], nextCursor: null }),
  })

export const useForumThread = (id: string) =>
  useQuery({
    queryKey: ['lms', 'forum', 'thread', id],
    queryFn: async (): Promise<ForumThreadDetailResponse> => {
      throw new ApiError(404, { error: 'Discussion forums are not on the UniFa API yet.' })
    },
  })

export const useReplyToThread = (_threadId: string) =>
  useMutation({
    mutationFn: async (_vars: CreateReplyRequest) => {
      throw new ApiError(400, { error: 'Discussion forums are not on the UniFa API yet.' })
    },
  })

export const useNotes = (q: string) =>
  useQuery({
    queryKey: ['lms', 'notes', q],
    queryFn: async (): Promise<Paginated<Note>> => ({ count: 0, next: null, previous: null, results: [] }),
  })

export const useCreateNote = (_q: string) =>
  useMutation({
    mutationFn: async (_vars: CreateNoteRequest) => {
      throw new ApiError(400, { error: 'Personal notes are not on the UniFa API yet.' })
    },
  })

export const useDeleteNote = (_q: string) =>
  useMutation({
    mutationFn: async (_id: string) => {
      throw new ApiError(400, { error: 'Personal notes are not on the UniFa API yet.' })
    },
  })

export const useLearningProgress = () =>
  useQuery({
    queryKey: ['lms', 'progress'],
    queryFn: async (): Promise<LearningProgressResponse> => {
      const mapped = mapLmsFromEnrollments(await enrollments())
      return {
        overallPercent: mapped.courses.length
          ? Math.round(mapped.courses.reduce((n, c) => n + c.progress, 0) / mapped.courses.length)
          : 0,
        studyMinutes: 0,
        streakDays: 0,
        courses: mapped.courses.map((c) => ({
          course: c.course,
          instructorName: c.instructorName,
          percent: c.progress,
          tone: 'brand',
        })),
      }
    },
  })

export const useLearningAnalytics = () =>
  useQuery({
    queryKey: ['lms', 'analytics'],
    queryFn: async (): Promise<LearningAnalyticsResponse> => ({
      proficiency: [],
      insight: 'Analytics are derived from your enrollments.',
      milestone: { label: 'Courses', value: '—' },
      focus: { label: 'Focus', value: 'Stay on top of assignments.' },
    }),
  })

export const useAnnouncements = () =>
  useQuery({
    queryKey: ['lms', 'announcements'],
    queryFn: async (): Promise<AnnouncementsResponse> =>
      mapAnnouncements(await apiFetch<UnifaAnnouncement[]>('/api/v1/campus/announcements')),
  })

export const useMarkAnnouncementRead = () =>
  useMutation({
    mutationFn: async (_id: string) => undefined,
  })

export const useGradebook = () =>
  useQuery({
    queryKey: ['lms', 'gradebook'],
    queryFn: async (): Promise<GradebookResponse> => mapLmsGradebook(await enrollments()),
  })
