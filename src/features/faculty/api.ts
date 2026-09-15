import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import { displayName } from '@/lib/auth'
import { mapResearch } from '@/lib/unifa'
import type { Attachment, Paginated } from '@/types'
import type {
  AssignedSectionsResponse,
  AttendanceSheetResponse,
  CreateAssignmentRequest,
  FacultyAcademicResponse,
  FacultyAssignment,
  FacultyAssignmentsResponse,
  FacultyExamsResponse,
  FacultyFinanceResponse,
  FacultyProfileResponse,
  GradeSubmissionRequest,
  GradeSubmissionResult,
  GradebookResponse,
  GrantsResponse,
  LibraryItem,
  ReserveItemResult,
  ResearchPortfolioResponse,
  SaveGradesRequest,
  SaveGradesResult,
  SectionDetailResponse,
  SubmissionDetailResponse,
  SubmissionsResponse,
  SubmitAttendanceRequest,
  SubmitAttendanceResult,
  UpdateProfileRequest,
} from '@/types/faculty'
import type {
  UnifaAssignment,
  UnifaAttendanceSession,
  UnifaBook,
  UnifaExam,
  UnifaMaterial,
  UnifaMe,
  UnifaResearch,
  UnifaSchedule,
  UnifaTeacherDashboard,
} from '@/types/unifa'

const dash = () => apiFetch<UnifaTeacherDashboard>('/api/v1/dashboard/teacher')

function sectionFromDash(d: UnifaTeacherDashboard, sectionId: string) {
  const row = d.sections.find((s) => s.section.id === sectionId) ?? d.sections[0]
  if (!row) return null
  return {
    id: row.section.id,
    course: {
      id: row.section.course.id,
      code: row.section.course.code,
      title: row.section.course.title,
      credits: row.section.course.credits,
    },
    name: row.section.sectionCode ?? 'A',
    termId: row.section.id,
    enrolledCount: row.section.enrollments.length,
    room: row.section.room ?? null,
    syllabusProgress: 40,
    chaptersDone: 0,
    chaptersTotal: 0,
  }
}

export const useFacultyAcademic = () =>
  useQuery({
    queryKey: ['faculty', 'academic'],
    queryFn: async (): Promise<FacultyAcademicResponse> => {
      const [d, routine] = await Promise.all([
        dash(),
        apiFetch<UnifaSchedule[]>('/api/v1/academic/my/routine').catch(() => []),
      ])
      return {
        metrics: [
          { label: 'Courses', value: String(d.totalCourses), tone: 'brand' },
          { label: 'Students', value: String(d.totalStudents), tone: 'info' },
        ],
        term: { id: 'current', name: 'Current term', weekNumber: 1, totalWeeks: 16 },
        weeklySchedule: routine.map((s) => ({
          id: s.id,
          label: s.course?.title ?? 'Class',
          room: s.room ?? 'TBA',
          day: s.dayOfWeek,
          startsAt: s.startTime,
          endsAt: s.endTime,
        })),
        milestones: [],
      }
    },
  })

export const useAssignedSections = () =>
  useQuery({
    queryKey: ['faculty', 'sections'],
    queryFn: async (): Promise<AssignedSectionsResponse> => {
      const d = await dash()
      return {
        sections: d.sections.map((row) => ({
          id: row.section.id,
          course: {
            id: row.section.course.id,
            code: row.section.course.code,
            title: row.section.course.title,
            credits: row.section.course.credits,
          },
          name: row.section.sectionCode ?? 'A',
          termId: row.section.id,
          enrolledCount: row.section.enrollments.length,
          room: row.section.room ?? null,
          syllabusProgress: 40,
          chaptersDone: 0,
          chaptersTotal: 0,
        })),
      }
    },
  })

export const useSectionDetail = (sectionId: string) =>
  useQuery({
    queryKey: ['faculty', 'sections', sectionId],
    queryFn: async (): Promise<SectionDetailResponse> => {
      const [d, materials] = await Promise.all([
        dash(),
        apiFetch<UnifaMaterial[]>(`/api/v1/lms/sections/${sectionId}/materials`).catch(() => []),
      ])
      const section = sectionFromDash(d, sectionId)
      if (!section) throw new ApiError(404, { error: 'Section not found' })
      return {
        section,
        materials: materials.map((m) => ({
          id: m.id,
          filename: m.title,
          sizeBytes: 0,
          mimeType: 'application/octet-stream',
          url: m.url,
          uploadedAt: m.createdAt ?? new Date().toISOString(),
        })),
        recentActivity: [],
      }
    },
  })

export const useUploadMaterials = (sectionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: FormData): Promise<Attachment[]> => {
      const title = String(form.get('title') ?? form.get('note') ?? 'Material')
      const url = String(form.get('url') ?? 'https://example.com/material')
      const row = await apiFetch<UnifaMaterial>(`/api/v1/lms/sections/${sectionId}/materials`, {
        method: 'POST',
        body: JSON.stringify({ title, type: 'LINK', url, description: String(form.get('note') ?? '') }),
      })
      return [
        {
          id: row.id,
          filename: row.title,
          sizeBytes: 0,
          mimeType: 'text/uri-list',
          url: row.url,
          uploadedAt: new Date().toISOString(),
        },
      ]
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty', 'sections', sectionId] })
    },
  })
}

export const useFacultyAssignments = () =>
  useQuery({
    queryKey: ['faculty', 'assignments'],
    queryFn: async (): Promise<FacultyAssignmentsResponse> => {
      const d = await dash()
      const assignments: FacultyAssignment[] = (
        await Promise.all(
          d.sections.map(async (row) => {
            const list = await apiFetch<UnifaAssignment[]>(
              `/api/v1/lms/sections/${row.section.id}/assignments`,
            ).catch(() => [] as UnifaAssignment[])
            const section = sectionFromDash(d, row.section.id)!
            return list.map((a) => ({
              id: a.id,
              title: a.title,
              section,
              dueAt: a.dueAt,
              totalPoints: a.maxMarks ?? 0,
              submittedCount: a._count?.submissions ?? a.submissions?.length ?? 0,
              gradedCount: a.submissions?.filter((s) => s.marks != null).length ?? 0,
              enrolledCount: row.section.enrollments.length,
              published: true,
            }))
          }),
        )
      ).flat()
      return {
        metrics: [{ label: 'Assignments', value: String(assignments.length), tone: 'brand' }],
        assignments,
        scoreDistribution: [],
        insight: null,
      }
    },
  })

export const useCreateAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: CreateAssignmentRequest): Promise<FacultyAssignment> => {
      const row = await apiFetch<UnifaAssignment>(`/api/v1/lms/sections/${vars.sectionId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          title: vars.title,
          description: vars.brief,
          dueAt: vars.dueAt,
          maxMarks: vars.totalPoints,
        }),
      })
      const d = await dash()
      const section = sectionFromDash(d, vars.sectionId)!
      return {
        id: row.id,
        title: row.title,
        section,
        dueAt: row.dueAt,
        totalPoints: vars.totalPoints,
        submittedCount: 0,
        gradedCount: 0,
        enrolledCount: section.enrolledCount,
        published: vars.publish,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty', 'assignments'] })
    },
  })
}

export const useSubmissions = (assignmentId: string) =>
  useQuery({
    queryKey: ['faculty', 'assignments', assignmentId, 'submissions'],
    queryFn: async (): Promise<SubmissionsResponse> => {
      const rows = await apiFetch<
        {
          id: string
          submittedAt?: string
          marks?: number | string | null
          student?: { id: string; studentNo?: string; user?: { firstName?: string; lastName?: string } }
        }[]
      >(`/api/v1/lms/assignments/${assignmentId}/submissions`)
      const d = await dash()
      const host = d.sections.find((s) => s.section.assignments.some((a) => a.id === assignmentId))
      const assignmentMeta = host?.section.assignments.find((a) => a.id === assignmentId)
      const section = host ? sectionFromDash(d, host.section.id)! : sectionFromDash(d, d.sections[0]?.section.id ?? '')!
      return {
        assignment: {
          id: assignmentId,
          title: assignmentMeta?.title ?? 'Assignment',
          section,
          dueAt: assignmentMeta?.dueAt ?? new Date().toISOString(),
          totalPoints: 0,
          submittedCount: rows.length,
          gradedCount: rows.filter((r) => r.marks != null).length,
          enrolledCount: section.enrolledCount,
          published: true,
        },
        rubric: [],
        submissions: rows.map((r) => ({
          id: r.id,
          student: {
            id: r.student?.id ?? r.id,
            registrationNo: r.student?.studentNo ?? '—',
            fullName: r.student?.user ? displayName(r.student.user) : 'Student',
            avatarUrl: null,
          },
          submittedAt: r.submittedAt ?? null,
          late: false,
          score: r.marks == null ? null : Number(r.marks),
          graded: r.marks != null,
        })),
      }
    },
  })

export const useSubmissionDetail = (submissionId: string) =>
  useQuery({
    queryKey: ['faculty', 'submissions', submissionId],
    queryFn: async (): Promise<SubmissionDetailResponse> => {
      throw new ApiError(404, { error: 'Open the assignment review list to grade UniFa submissions.' })
    },
  })

export const useGradeSubmission = (submissionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: GradeSubmissionRequest): Promise<GradeSubmissionResult> => {
      const total = vars.scores.reduce((n, s) => n + s.points, 0)
      await apiFetch(`/api/v1/lms/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: JSON.stringify({ marks: total, feedback: vars.feedback }),
      })
      return { id: submissionId, totalScore: total, grade: '', released: vars.release, gradedAt: new Date().toISOString() }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty'] })
    },
  })
}

export const useGradebook = (sectionId: string) =>
  useQuery({
    queryKey: ['faculty', 'gradebook', sectionId],
    queryFn: async (): Promise<GradebookResponse> => {
      const report = await apiFetch<{
        id: string
        course: { id: string; code: string; title: string; credits: number }
        enrollments: {
          id: string
          letterGrade?: string | null
          student: { id: string; studentNo?: string; user?: { firstName?: string; lastName?: string } }
          examResults?: { id: string; marks?: number | string; exam?: { id: string; title: string } }[]
        }[]
      }>(`/api/v1/faculty/reports/section/${sectionId}`)
      const columns =
        report.enrollments[0]?.examResults?.map((r) => ({
          id: r.exam?.id ?? r.id,
          label: r.exam?.title ?? 'Exam',
          maxPoints: 100,
          weightPercent: 100,
          editable: true,
        })) ?? []
      return {
        section: {
          id: report.id,
          course: report.course,
          name: 'A',
          termId: report.id,
          enrolledCount: report.enrollments.length,
          room: null,
        },
        columns,
        rows: report.enrollments.map((e) => ({
          student: {
            id: e.student.id,
            registrationNo: e.student.studentNo ?? '—',
            fullName: e.student.user ? displayName(e.student.user) : 'Student',
            avatarUrl: null,
          },
          scores: Object.fromEntries(
            (e.examResults ?? []).map((r) => [r.exam?.id ?? r.id, r.marks == null ? null : Number(r.marks)]),
          ),
          total: null,
          grade: e.letterGrade ?? null,
        })),
        remainingEntries: 0,
      }
    },
  })

export const useSaveGrades = (_sectionId: string) =>
  useMutation({
    mutationFn: async (_vars: SaveGradesRequest): Promise<SaveGradesResult> => {
      throw new ApiError(400, { error: 'Enter marks per exam via POST /api/v1/exams/:id/results.' })
    },
  })

export const useAttendanceSheet = (sectionId: string, date: string) =>
  useQuery({
    queryKey: ['faculty', 'attendance', sectionId, date],
    queryFn: async (): Promise<AttendanceSheetResponse> => {
      const [d, sessions] = await Promise.all([
        dash(),
        apiFetch<UnifaAttendanceSession[]>(`/api/v1/attendance/sections/${sectionId}`).catch(() => []),
      ])
      const section = sectionFromDash(d, sectionId)
      if (!section) throw new ApiError(404, { error: 'Section not found' })
      const session = sessions.find((s) => s.heldAt.slice(0, 10) === date) ?? sessions[0]
      return {
        section,
        date,
        session: session
          ? { id: session.id, startsAt: session.heldAt, endsAt: session.heldAt }
          : null,
        roster: (session?.records ?? []).map((r) => ({
          student: {
            id: r.student?.id ?? r.studentId ?? r.id,
            registrationNo: r.student?.studentNo ?? '—',
            fullName: r.student?.user ? displayName(r.student.user) : 'Student',
            avatarUrl: null,
          },
          mark: r.status,
        })),
        submitted: Boolean(session),
        lastSession: session
          ? {
              date: session.heldAt.slice(0, 10),
              presentCount: session.records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
              totalCount: session.records.length,
            }
          : null,
      }
    },
  })

export const useSubmitAttendance = (_sessionId: string, key: unknown[]) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: SubmitAttendanceRequest): Promise<SubmitAttendanceResult> => {
      const sectionId = String(key[2] ?? '')
      const heldAt = new Date().toISOString()
      const session = await apiFetch<{ id: string; records: { status: string }[] }>('/api/v1/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          sectionId,
          heldAt,
          records: vars.marks.map((m) => ({ studentId: m.studentId, status: m.mark })),
        }),
      })
      return {
        sessionId: session.id,
        presentCount: session.records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
        totalCount: session.records.length,
        submittedAt: heldAt,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty', 'attendance'] })
    },
  })
}

export const useFacultyExams = () =>
  useQuery({
    queryKey: ['faculty', 'exams'],
    queryFn: async (): Promise<FacultyExamsResponse> => {
      const [d, exams] = await Promise.all([dash(), apiFetch<UnifaExam[]>('/api/v1/exams')])
      return {
        metrics: [{ label: 'Exams', value: String(exams.length), tone: 'brand' }],
        papers: d.sections.map((row) => ({
          id: row.section.id,
          section: sectionFromDash(d, row.section.id)!,
          status: 'DRAFT',
          dueAt: new Date().toISOString(),
          submittedAt: null,
        })),
        duties: exams.flatMap((e) =>
          e.schedules.map((s) => ({
            id: s.id,
            title: e.title,
            startsAt: s.startsAt,
            endsAt: s.startsAt,
            venue: s.room ?? 'TBA',
          })),
        ),
      }
    },
  })

const PROFILE_KEY = ['faculty', 'profile']

export const useFacultyProfile = () =>
  useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async (): Promise<FacultyProfileResponse> => {
      const me = await apiFetch<UnifaMe>('/api/v1/auth/me')
      return {
        id: me.id,
        fullName: displayName(me),
        designation: me.teacher?.designation ?? 'Faculty',
        email: me.email,
        phone: me.phone,
        officeRoom: null,
        avatarUrl: me.avatarUrl,
        specializations: [],
        metrics: [],
        education: [],
      }
    },
  })

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (_vars: UpdateProfileRequest): Promise<FacultyProfileResponse> => {
      throw new ApiError(400, { error: 'Faculty profile fields are owned by the registrar in UniFa.' })
    },
  })

export const useResearchPortfolio = () =>
  useQuery({
    queryKey: ['faculty', 'research'],
    queryFn: async (): Promise<ResearchPortfolioResponse> =>
      mapResearch(await apiFetch<UnifaResearch>('/api/v1/faculty/research')),
  })

export const useGrants = () =>
  useQuery({
    queryKey: ['faculty', 'research', 'grants'],
    queryFn: async (): Promise<GrantsResponse> => {
      const data = await apiFetch<UnifaResearch>('/api/v1/faculty/research')
      return {
        currency: 'BDT',
        metrics: [{ label: 'Projects', value: String(data.projects.length), tone: 'brand' }],
        projects: data.projects.map((p) => ({
          id: p.id,
          title: p.title,
          state: 'ACTIVE' as const,
          fundingBody: '—',
          awarded: '0',
          spent: '0',
          startsOn: new Date().toISOString().slice(0, 10),
          endsOn: new Date().toISOString().slice(0, 10),
          assistantCount: 0,
        })),
        publications: data.publications.map((p) => ({
          id: p.id,
          title: p.title,
          venue: p.venue ?? '—',
          year: p.year ?? new Date().getFullYear(),
          citationCount: 0,
          doi: null,
          url: p.url ?? null,
        })),
      }
    },
  })

export const useFacultyLibrary = (q: string, kind: string) =>
  useQuery({
    queryKey: ['faculty', 'library', q, kind],
    queryFn: async (): Promise<Paginated<LibraryItem>> => {
      const books = await apiFetch<UnifaBook[]>('/api/v1/campus/library/books')
      const needle = q.trim().toLowerCase()
      const results = books
        .filter((b) => !needle || `${b.title} ${b.author}`.toLowerCase().includes(needle))
        .map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          kind: 'BOOK' as const,
          year: null,
          available: b.copies.some((c) => !c.status || c.status === 'AVAILABLE'),
          availableAt: null,
          shelf: null,
        }))
      return { count: results.length, next: null, previous: null, results }
    },
  })

export const useReserveItem = (_key: unknown[]) =>
  useMutation({
    mutationFn: async (_id: string): Promise<ReserveItemResult> => {
      throw new ApiError(400, { error: 'Library issue is a staff action in UniFa.' })
    },
  })

export const useFacultyFinance = () =>
  useQuery({
    queryKey: ['faculty', 'finance'],
    queryFn: async (): Promise<FacultyFinanceResponse> => ({
      currency: 'BDT',
      metrics: [],
      payslips: [],
      payoutMethod: null,
    }),
  })
