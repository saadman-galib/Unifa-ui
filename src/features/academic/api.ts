import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/hooks/use-api'
import {
  mapCalendar,
  mapClassrooms,
  mapCourseOfferings,
  mapCurriculum,
  mapCreditProgress,
  mapDegreeProgress,
  mapDropAdd,
  mapFacultyDirectory,
  mapMyCourses,
  mapRoutine,
  mapSemesterRegistration,
} from '@/lib/unifa'
import type {
  AcademicCalendarResponse,
  AddCourseRequest,
  ClassRoutineResponse,
  ClassroomsResponse,
  CourseOffering,
  CreditProgressResponse,
  CurriculumResponse,
  DegreeProgressResponse,
  DropAddRequest,
  DropAddResponse,
  DropAddResult,
  FacultyDirectoryEntry,
  MyCoursesResponse,
  Paginated,
  SemesterRegistrationRequest,
  SemesterRegistrationResponse,
} from '@/types'
import type {
  UnifaCalendarEvent,
  UnifaCourse,
  UnifaDepartment,
  UnifaEnrollment,
  UnifaSchedule,
  UnifaSection,
  UnifaSemester,
  UnifaTranscript,
} from '@/types/unifa'

export const useMyEnrollments = () =>
  useQuery({
    queryKey: ['academic', 'enrollments'],
    queryFn: () => apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments'),
  })

export const useMyCourses = () =>
  useQuery({
    queryKey: ['academic', 'courses'],
    queryFn: async (): Promise<MyCoursesResponse> =>
      mapMyCourses(await apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments')),
  })

export const useCurriculum = () =>
  useQuery({
    queryKey: ['academic', 'curriculum'],
    queryFn: async (): Promise<CurriculumResponse> => {
      const [courses, enrollments] = await Promise.all([
        apiFetch<UnifaCourse[]>('/api/v1/academic/courses'),
        apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments'),
      ])
      return mapCurriculum(courses, enrollments)
    },
  })

export const useDegreeProgress = () =>
  useQuery({
    queryKey: ['academic', 'degree-progress'],
    queryFn: async (): Promise<DegreeProgressResponse> =>
      mapDegreeProgress(await apiFetch<UnifaTranscript>('/api/v1/academic/my/transcript')),
  })

export const useCreditProgress = () =>
  useQuery({
    queryKey: ['academic', 'credits'],
    queryFn: async (): Promise<CreditProgressResponse> =>
      mapCreditProgress(await apiFetch<UnifaTranscript>('/api/v1/academic/my/transcript')),
  })

export const useClassRoutine = () =>
  useQuery({
    queryKey: ['academic', 'routine'],
    queryFn: async (): Promise<ClassRoutineResponse> =>
      mapRoutine(await apiFetch<UnifaSchedule[]>('/api/v1/academic/my/routine')),
  })

export const useAcademicCalendar = (month: string) =>
  useQuery({
    queryKey: ['academic', 'calendar', month],
    queryFn: async (): Promise<AcademicCalendarResponse> =>
      mapCalendar(await apiFetch<UnifaCalendarEvent[]>('/api/v1/academic/calendar'), month),
  })

export const useFacultyDirectory = (q: string) =>
  useQuery({
    queryKey: ['academic', 'faculty', q],
    queryFn: async (): Promise<Paginated<FacultyDirectoryEntry>> => {
      const page = mapFacultyDirectory(await apiFetch<UnifaDepartment[]>('/api/v1/academic/departments'))
      const needle = q.trim().toLowerCase()
      if (!needle) return page
      const results = page.results.filter(
        (f) => f.name.toLowerCase().includes(needle) || f.department.toLowerCase().includes(needle),
      )
      return { ...page, count: results.length, results }
    },
  })

export const useClassrooms = () =>
  useQuery({
    queryKey: ['academic', 'classrooms'],
    queryFn: async (): Promise<ClassroomsResponse> =>
      mapClassrooms(await apiFetch<UnifaSection[]>('/api/v1/academic/sections')),
  })

export const useSemesterRegistration = () =>
  useQuery({
    queryKey: ['academic', 'registration', 'semester'],
    queryFn: async (): Promise<SemesterRegistrationResponse> => {
      const [semesters, enrollments] = await Promise.all([
        apiFetch<UnifaSemester[]>('/api/v1/academic/semesters'),
        apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments'),
      ])
      return mapSemesterRegistration(semesters, enrollments)
    },
  })

export const useSubmitSemesterRegistration = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_vars: SemesterRegistrationRequest) =>
      apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academic'] })
    },
  })
}

const OFFERINGS_KEY = ['academic', 'registration', 'courses']

export const useCourseOfferings = (q: string, department: string) =>
  useQuery({
    queryKey: [...OFFERINGS_KEY, q, department],
    queryFn: async (): Promise<Paginated<CourseOffering>> => {
      const [sections, enrollments] = await Promise.all([
        apiFetch<UnifaSection[]>('/api/v1/academic/sections'),
        apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments'),
      ])
      return mapCourseOfferings(sections, enrollments, q, department)
    },
  })

export const useAddCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: AddCourseRequest) =>
      apiFetch('/api/v1/academic/enrollments', {
        method: 'POST',
        body: JSON.stringify({ sectionId: vars.offeringId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['academic'] })
    },
  })
}

export const useRemoveCourse = () =>
  useMutation({
    mutationFn: async (_offeringId: string) => {
      throw new ApiError(400, { error: 'Drop is not available on this screen. Use Drop / Add.' })
    },
  })

export const useDropAdd = () =>
  useQuery({
    queryKey: ['academic', 'registration', 'drop-add'],
    queryFn: async (): Promise<DropAddResponse> =>
      mapDropAdd(await apiFetch<UnifaEnrollment[]>('/api/v1/academic/my/enrollments')),
  })

export const useSubmitDropAdd = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: DropAddRequest): Promise<DropAddResult> => {
      if (vars.action === 'DROP') {
        throw new ApiError(400, { error: 'Dropping a section is not available in UniFa yet.' })
      }
      await apiFetch('/api/v1/academic/enrollments', {
        method: 'POST',
        body: JSON.stringify({ sectionId: vars.offeringId }),
      })
      return {
        id: vars.offeringId,
        action: vars.action,
        offeringId: vars.offeringId,
        status: 'APPROVED',
        submittedAt: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['academic'] })
    },
  })
}
