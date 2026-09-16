/**
 * Map UniFa `/api/v1` resources onto the screen-shaped types the existing
 * pages already render. The portal was designed around a BFF; UniFa is
 * resource-oriented, so aggregates that used to arrive in one payload are
 * derived here.
 */

import { displayName, mapRole } from '@/lib/auth'
import { gpa, money, percent } from '@/lib/format'
import type {
  AcademicCalendarResponse,
  AiAdvisorResponse,
  AiConversationResponse,
  AiOverviewResponse,
  Assignment,
  AssignmentsResponse,
  AttendanceAnalyticsResponse,
  AttendanceHistoryResponse,
  AttendanceOverviewResponse,
  CertificatesResponse,
  ClassRoutineResponse,
  CourseAttendanceResponse,
  CourseOffering,
  CurriculumResponse,
  DailyAttendanceResponse,
  DegreeProgressResponse,
  CreditProgressResponse,
  CurriculumState,
  DropAddResponse,
  EnrolledCourse,
  ExamAnalyticsResponse,
  ExamOverviewResponse,
  ExamResultsResponse,
  ExamScheduleResponse,
  ExamSlot,
  FacultyDirectoryEntry,
  FeeStatementResponse,
  FinanceOverviewResponse,
  GradeReportResponse,
  GradebookResponse,
  HostelOverviewResponse,
  InstallmentsResponse,
  InvoicesResponse,
  LibraryHistoryResponse,
  LibraryOverviewResponse,
  LmsCoursesResponse,
  LmsOverviewResponse,
  MaterialsResponse,
  Metric,
  MyBorrowedBooksResponse,
  MyCoursesResponse,
  Paginated,
  PaymentHistoryResponse,
  PaymentIntent,
  PaymentOptionsResponse,
  PracticeQuizResponse,
  ProfileResponse,
  QuizAttemptResult,
  QuizzesResponse,
  RecommendationsResponse,
  SemesterRegistrationResponse,
  ServiceRequest,
  StudentDashboardResponse,
  StudentServicesResponse,
  TransportOverviewResponse,
  Weekday,
} from '@/types'
import type { AdminDashboardResponse, UserManagementResponse, UserRow } from '@/types/admin'
import type { FacultyDashboardResponse, ResearchPortfolioResponse, Section } from '@/types/faculty'
import type {
  UnifaAdminDashboard,
  UnifaAnnouncement,
  UnifaAskResponse,
  UnifaAssignment,
  UnifaAttendanceMy,
  UnifaBook,
  UnifaCalendarEvent,
  UnifaCertificate,
  UnifaConversation,
  UnifaCourse,
  UnifaDepartment,
  UnifaDirectoryUser,
  UnifaEnrollment,
  UnifaExam,
  UnifaExamResult,
  UnifaFinanceReport,
  UnifaHostel,
  UnifaInvoice,
  UnifaMaterial,
  UnifaMe,
  UnifaPayment,
  UnifaQuiz,
  UnifaResearch,
  UnifaRoute,
  UnifaSchedule,
  UnifaSection,
  UnifaSemester,
  UnifaStudentDashboard,
  UnifaTeacherDashboard,
  UnifaTeacherSection,
  UnifaTicket,
} from '@/types/unifa'

export const num = (v: string | number | null | undefined) => Number(v ?? 0)

export const isoDate = (v: string | undefined | null) => (v ?? new Date().toISOString()).slice(0, 10)

const DAY: Record<string, Weekday> = {
  SATURDAY: 'SAT',
  SUNDAY: 'SUN',
  MONDAY: 'MON',
  TUESDAY: 'TUE',
  WEDNESDAY: 'WED',
  THURSDAY: 'THU',
  FRIDAY: 'FRI',
}

const TONES = ['brand', 'accent', 'info', 'success', 'warning', 'danger'] as const

export function courseRef(course: Pick<UnifaCourse, 'id' | 'code' | 'title' | 'credits'>) {
  return { id: course.id, code: course.code, title: course.title, credits: course.credits }
}

function instructorName(section: UnifaEnrollment['section'] | UnifaSection) {
  const user = section.instructors?.[0]?.teacher?.user
  return user ? displayName(user) : 'Instructor'
}

function metric(label: string, value: string, tone: Metric['tone'], icon?: string, extra?: Partial<Metric>): Metric {
  return { label, value, tone, icon, ...extra }
}

function todayIso(time: string) {
  const [h = '0', m = '0'] = time.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toISOString()
}

function jsDayName() {
  return ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()]
}

export function mapStudentDashboard(d: UnifaStudentDashboard, firstName = 'there'): StudentDashboardResponse {
  const term = d.enrollments[0]?.section.semester?.name ?? 'Current term'
  return {
    hero: {
      badge: term,
      heading: `Welcome back, ${firstName}`,
      body: d.notices[0]?.body ?? 'Here is your academic snapshot for this term.',
    },
    metrics: [
      metric('GPA', gpa(d.gpa), 'brand', 'GraduationCap'),
      metric('Attendance', percent(d.attendance), 'info', 'CalendarCheck', { progress: d.attendance }),
      metric('Courses', String(d.courses), 'accent', 'BookOpen'),
      metric('Dues', money(d.dues), d.dues > 0 ? 'danger' : 'success', 'Wallet'),
    ],
    deadlines: d.notices.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      dueAt: n.createdAt,
      kind: n.audience ?? 'Notice',
      isOverdue: false,
      href: '/student/communication',
    })),
    courses: d.enrollments.map((e) => ({
      course: courseRef(e.section.course),
      instructorName: instructorName(e.section),
      mode: e.section.room ?? e.section.schedules?.[0]?.room ?? 'Campus',
      status: (e.status as 'ENROLLED') ?? 'ENROLLED',
      grade: e.letterGrade ?? null,
    })),
  }
}

export function mapFacultyDashboard(d: UnifaTeacherDashboard): FacultyDashboardResponse {
  const today = jsDayName()
  const todaySchedule = d.sections.flatMap((row) =>
    row.section.schedules
      .filter((s) => s.dayOfWeek === today)
      .map((s) => ({
        id: s.id,
        section: mapSection(row),
        startsAt: todayIso(s.startTime),
        endsAt: todayIso(s.endTime),
        room: s.room ?? row.section.room ?? 'TBA',
        state: 'UPCOMING' as const,
      })),
  )
  const pendingReviews = d.sections.flatMap((row) =>
    row.section.assignments.flatMap((a) =>
      a.submissions
        .filter((s) => s.marks == null)
        .map((s) => ({
          id: s.id,
          assignmentTitle: a.title,
          student: {
            id: s.studentId ?? s.id,
            registrationNo: s.student?.studentNo ?? '—',
            fullName: s.student?.user ? displayName(s.student.user) : 'Student',
            avatarUrl: null,
          },
          submittedAt: s.submittedAt ?? new Date().toISOString(),
        })),
    ),
  )
  return {
    metrics: [
      metric('Courses', String(d.totalCourses), 'brand', 'BookOpen'),
      metric('Students', String(d.totalStudents), 'info', 'Users'),
      metric("Today's classes", String(d.todaysClasses), 'accent', 'Clock'),
      metric('Pending reviews', String(d.pendingAssignments), 'warning', 'ClipboardList'),
    ],
    todaySchedule,
    sections: d.sections.map(mapSection),
    pendingReviews,
    teachingLoad: { completedHours: Math.max(0, d.todaysClasses), remainingHours: Math.max(0, d.totalCourses * 3) },
    activity: pendingReviews.slice(0, 5).map((r) => ({
      id: r.id,
      title: `${r.assignmentTitle} — ${r.student.fullName}`,
      at: r.submittedAt,
      tone: 'warning' as const,
    })),
    insight: null,
  }
}

function mapSection(row: UnifaTeacherSection): Section {
  return {
    id: row.section.id,
    course: courseRef(row.section.course),
    name: row.section.sectionCode ?? 'A',
    termId: row.section.id,
    enrolledCount: row.section.enrollments.length,
    room: row.section.room ?? null,
  }
}

export function mapAdminDashboard(
  d: UnifaAdminDashboard,
  announcements: UnifaAnnouncement[] = [],
  departments: UnifaDepartment[] = [],
  report: UnifaFinanceReport | null = null,
): AdminDashboardResponse {
  const collected = report?.collected ?? d.revenue
  return {
    currency: 'BDT',
    metrics: [
      metric('Students', String(d.totalStudents), 'brand', 'Users'),
      metric('Teachers', String(d.totalTeachers), 'info', 'GraduationCap'),
      metric('Departments', String(d.departments), 'accent', 'Building2'),
      metric('Courses', String(d.courses), 'success', 'BookOpen'),
      metric('Revenue', money(collected), 'success', 'Banknote'),
      metric('Pending', String(d.pendingRequests), d.pendingRequests ? 'warning' : 'success', 'TriangleAlert'),
    ],
    enrolment: [{ month: 'Now', students: d.totalStudents }],
    distribution: [
      { label: 'Students', value: d.totalStudents, tone: 'brand' },
      { label: 'Teachers', value: d.totalTeachers, tone: 'accent' },
    ],
    totalStudents: d.totalStudents,
    announcements: announcements.slice(0, 6).map((a) => ({
      id: a.id,
      title: a.title,
      note: a.body,
      publishedAt: a.createdAt,
    })),
    systems: [{ id: 'api', label: 'UniFa API', healthy: true }],
    financial: {
      collected: String(collected),
      target: String(Math.max(collected, 1)),
      percent: collected > 0 ? 100 : 0,
    },
    departments: departments.map((dep, i) => ({
      department: { id: dep.id, name: dep.name, code: dep.code },
      students: 0,
      percent: 0,
      tone: TONES[i % TONES.length],
    })),
    events: announcements.slice(0, 4).map((a) => ({
      id: a.id,
      title: a.title,
      note: a.body,
      startsAt: a.createdAt,
    })),
  }
}

export function mapProfile(me: UnifaMe): ProfileResponse {
  const role = mapRole(me.role) ?? 'student'
  const student = me.student
  return {
    id: me.id,
    role,
    fullName: displayName(me),
    email: me.email,
    avatarUrl: me.avatarUrl,
    registrationNo: student?.studentNo ?? me.teacher?.employeeNo ?? null,
    department: student?.department.name ?? me.teacher?.department.name ?? null,
    programme: student?.program.name ?? me.teacher?.designation ?? null,
    currentTerm: null,
    status: me.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    bloodGroup: null,
    nationalId: null,
    dateOfBirth: null,
    gender: null,
    phone: me.phone,
    alternatePhone: null,
    presentAddress: null,
    permanentAddress: null,
    emergencyContact: null,
    academic: {
      faculty: student?.department.name ?? null,
      advisor: null,
      admissionDate: student?.admissionYear ? `${student.admissionYear}-01-01` : null,
      expectedGraduation: null,
      campus: null,
      enrollmentStatus: me.status,
    },
    documents: [],
    activity: me.lastLoginAt
      ? [{ id: 'login', title: 'Last sign-in', detail: null, category: 'SECURITY', at: me.lastLoginAt }]
      : [],
  }
}

export function mapMyCourses(enrollments: UnifaEnrollment[]): MyCoursesResponse {
  const courses: EnrolledCourse[] = enrollments.map((e) => ({
    course: courseRef(e.section.course),
    instructorName: instructorName(e.section),
    progress: e.letterGrade ? 100 : 40,
    grade: e.letterGrade ?? null,
    status: (e.status as EnrolledCourse['status']) ?? 'ENROLLED',
  }))
  return {
    metrics: [
      metric('Enrolled', String(courses.length), 'brand', 'BookOpen'),
      metric('Completed', String(courses.filter((c) => c.grade).length), 'success', 'Award'),
    ],
    courses,
  }
}

export function mapRoutine(slots: UnifaSchedule[]): ClassRoutineResponse {
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return {
    weekOf: isoDate(monday.toISOString()),
    slots: slots.map((s, i) => ({
      id: s.id,
      day: DAY[s.dayOfWeek] ?? 'SUN',
      startsAt: s.startTime,
      endsAt: s.endTime,
      course: courseRef(
        s.course ?? { id: s.id, code: '—', title: 'Class', credits: 0 },
      ),
      room: s.room ?? 'TBA',
      tone: TONES[i % TONES.length],
    })),
    dailyGoalPercent: 0,
    recentFiles: [],
    campusWifiSsid: null,
  }
}

export function mapCalendar(events: UnifaCalendarEvent[], month: string): AcademicCalendarResponse {
  const kindTone: Record<string, Metric['tone']> = {
    EXAM: 'danger',
    HOLIDAY: 'success',
    REGISTRATION: 'brand',
    EVENT: 'info',
  }
  return {
    month,
    events: events.map((e) => ({
      id: e.id,
      date: isoDate(e.startDate),
      label: e.title,
      tone: kindTone[e.type] ?? 'info',
      kind: e.type,
    })),
  }
}

export function mapCurriculum(courses: UnifaCourse[], enrollments: UnifaEnrollment[]): CurriculumResponse {
  const enrolled = new Set(enrollments.map((e) => e.section.course.id))
  const done = new Set(enrollments.filter((e) => e.letterGrade).map((e) => e.section.course.id))
  const entries = courses.map((c) => ({
    course: courseRef(c),
    department: c.department?.name ?? c.department?.code ?? '—',
    state: (done.has(c.id) ? 'DONE' : enrolled.has(c.id) ? 'IN_PROGRESS' : 'REMAINING') as CurriculumState,
  }))
  return {
    stats: [
      metric('Done', String(entries.filter((e) => e.state === 'DONE').length), 'success'),
      metric('In progress', String(entries.filter((e) => e.state === 'IN_PROGRESS').length), 'info'),
      metric('Remaining', String(entries.filter((e) => e.state === 'REMAINING').length), 'warning'),
    ],
    entries,
  }
}

export function mapDegreeProgress(t: { studentNo: string; cgpa: number; enrollments: UnifaEnrollment[] }): DegreeProgressResponse {
  const total = t.enrollments.length || 1
  const done = t.enrollments.filter((e) => e.letterGrade).length
  const percentDone = Math.round((done / total) * 100)
  return {
    buckets: [
      { label: 'Completed', note: `${done} courses`, percent: percentDone, tone: 'success' },
      { label: 'In progress', note: `${total - done} courses`, percent: 100 - percentDone, tone: 'info' },
    ],
    milestones: t.enrollments.slice(0, 6).map((e) => ({
      id: e.id,
      title: e.section.course.title,
      note: e.letterGrade ?? e.status,
      state: e.letterGrade ? 'DONE' : 'CURRENT',
    })),
    nextDeadline: null,
    forecast: `CGPA ${gpa(t.cgpa)} across ${total} courses.`,
  }
}

export function mapCreditProgress(t: { cgpa: number; enrollments: UnifaEnrollment[] }): CreditProgressResponse {
  const earned = t.enrollments.reduce((n, e) => n + (e.letterGrade ? e.section.course.credits : 0), 0)
  const required = t.enrollments.reduce((n, e) => n + e.section.course.credits, 0) || 160
  return {
    overall: { earned, required },
    byCategory: [{ label: 'Enrolled courses', earned, required, tone: 'brand' }],
    perTerm: Object.values(
      t.enrollments.reduce<Record<string, { termId: string; termName: string; credits: number; gpa: number }>>(
        (acc, e) => {
          const id = e.section.semester?.id ?? 'current'
          const name = e.section.semester?.name ?? 'Current term'
          acc[id] ??= { termId: id, termName: name, credits: 0, gpa: t.cgpa }
          acc[id].credits += e.section.course.credits
          return acc
        },
        {},
      ),
    ),
  }
}

export function mapFacultyDirectory(departments: UnifaDepartment[]): Paginated<FacultyDirectoryEntry> {
  const results: FacultyDirectoryEntry[] = departments.flatMap((d) => {
    const head = d.head?.user
    if (!head) return []
    return [
      {
        id: d.id,
        name: displayName(head),
        title: `Head of ${d.name}`,
        email: null,
        avatarUrl: null,
        officeRoom: null,
        department: d.name,
        officeHours: null,
      },
    ]
  })
  return { count: results.length, next: null, previous: null, results }
}

export function mapClassrooms(sections: UnifaSection[]) {
  const rooms = sections
    .filter((s) => s.room)
    .map((s) => ({
      id: s.id,
      name: s.room ?? 'TBA',
      building: s.course.department?.name ?? 'Campus',
      floor: null,
      capacity: s.capacity,
      currentSession: null,
    }))
  return { rooms }
}

export function mapSemesterRegistration(
  semesters: UnifaSemester[],
  enrollments: UnifaEnrollment[],
): SemesterRegistrationResponse {
  const credits = enrollments.reduce((n, e) => n + e.section.course.credits, 0)
  return {
    terms: semesters.map((s) => ({
      id: s.id,
      name: s.name,
      state: s.isCurrent ? 'OPEN' : 'CLOSED',
      opensAt: s.startDate ?? new Date().toISOString(),
      closesAt: s.endDate ?? new Date().toISOString(),
    })),
    advisor: { id: 'advisor', name: 'Academic advisor', department: 'Registrar' },
    selection: {
      courseCount: enrollments.length,
      totalCredits: credits,
      estimatedFee: '0',
      currency: 'BDT',
    },
    approval: enrollments.length ? 'APPROVED' : 'NOT_SUBMITTED',
  }
}

export function mapCourseOfferings(
  sections: UnifaSection[],
  enrollments: UnifaEnrollment[],
  q: string,
  department: string,
): Paginated<CourseOffering> {
  const enrolled = new Set(enrollments.map((e) => e.section.id))
  const needle = q.trim().toLowerCase()
  const results = sections
    .filter((s) => {
      if (department && department !== 'All Departments' && s.course.department?.name !== department) return false
      if (!needle) return true
      return `${s.course.code} ${s.course.title}`.toLowerCase().includes(needle)
    })
    .map((s) => {
      const taken = s._count?.enrollments ?? 0
      const already = enrolled.has(s.id)
      return {
        id: s.id,
        course: courseRef(s.course),
        department: s.course.department?.name ?? '—',
        section: s.sectionCode,
        instructorName: instructorName(s),
        seatsTaken: taken,
        seatsTotal: s.capacity,
        notice: already ? { text: 'Already enrolled', tone: 'brand' as const } : null,
        canRegister: !already && taken < s.capacity,
        blockedReason: already ? 'Already added.' : taken >= s.capacity ? 'Section is full' : null,
      }
    })
  return { count: results.length, next: null, previous: null, results }
}

export function mapDropAdd(enrollments: UnifaEnrollment[]): DropAddResponse {
  return {
    enrolled: enrollments.map((e) => ({
      offeringId: e.section.id,
      course: courseRef(e.section.course),
      instructorName: instructorName(e.section),
      canDrop: false,
    })),
    enrolledCredits: enrollments.reduce((n, e) => n + e.section.course.credits, 0),
    fullTimeMinimumCredits: 12,
    dropDeadline: isoDate(new Date().toISOString()),
  }
}

export function mapLmsFromEnrollments(enrollments: UnifaEnrollment[]): LmsOverviewResponse & LmsCoursesResponse {
  const courses = enrollments.map((e) => ({
    course: courseRef(e.section.course),
    instructorName: instructorName(e.section),
    progress: e.letterGrade ? 100 : 35,
    grade: e.letterGrade ?? null,
  }))
  return {
    metrics: [
      metric('Courses', String(courses.length), 'brand', 'BookOpen'),
      metric('Graded', String(courses.filter((c) => c.grade).length), 'success', 'Award'),
    ],
    courses,
    termId: enrollments[0]?.section.semester?.id ?? 'current',
    termName: enrollments[0]?.section.semester?.name ?? 'Current term',
  }
}

function assignmentState(dueAt: string, submitted: boolean, graded: boolean): Assignment['state'] {
  if (graded) return 'GRADED'
  if (submitted) return 'SUBMITTED'
  const due = new Date(dueAt).getTime()
  if (due < Date.now()) return 'OVERDUE'
  if (due - Date.now() < 3 * 86400000) return 'DUE_SOON'
  return 'OPEN'
}

export function mapAssignments(
  rows: { assignment: UnifaAssignment; enrollment: UnifaEnrollment }[],
): AssignmentsResponse {
  const assignments: Assignment[] = rows.map(({ assignment: a, enrollment: e }) => {
    const mine = a.submissions?.[0]
    return {
      id: a.id,
      title: a.title,
      course: courseRef(e.section.course),
      summary: a.description ?? '',
      dueAt: a.dueAt,
      state: assignmentState(a.dueAt, Boolean(mine?.submittedAt ?? mine), mine?.marks != null),
      grade: mine?.marks != null ? String(mine.marks) : null,
      submittedAt: mine?.submittedAt ?? null,
    }
  })
  return {
    metrics: [
      metric('Open', String(assignments.filter((a) => a.state === 'OPEN' || a.state === 'DUE_SOON').length), 'info'),
      metric('Submitted', String(assignments.filter((a) => a.state === 'SUBMITTED' || a.state === 'GRADED').length), 'success'),
    ],
    assignments,
  }
}

export function mapMaterials(courseId: string, materials: UnifaMaterial[]): MaterialsResponse {
  const groups = Object.entries(
    materials.reduce<Record<string, UnifaMaterial[]>>((acc, m) => {
      const key = m.type || 'OTHER'
      acc[key] ??= []
      acc[key].push(m)
      return acc
    }, {}),
  ).map(([type, files], i) => ({
    id: type,
    label: type,
    tone: TONES[i % TONES.length],
    fileCount: files.length,
    totalBytes: 0,
  }))
  return { courseId, groups }
}

export function mapAttendanceOverview(data: UnifaAttendanceMy): AttendanceOverviewResponse {
  return {
    metrics: [
      metric('Overall', percent(data.overall), data.overall >= 75 ? 'success' : 'danger', 'CalendarCheck', {
        progress: data.overall,
      }),
      metric('Courses', String(data.analytics.length), 'brand', 'BookOpen'),
      metric('Sessions', String(data.records.length), 'info', 'Clock'),
    ],
    today: data.records.slice(0, 4).map((r) => ({
      id: r.id,
      course: courseRef(r.session?.section?.course ?? { id: r.id, code: '—', title: 'Class', credits: 0 }),
      startsAt: r.session?.heldAt ?? new Date().toISOString(),
      endsAt: r.session?.heldAt ?? new Date().toISOString(),
      mark: r.status,
    })),
    streakNote: data.overall >= 90 ? 'Excellent attendance this term.' : null,
  }
}

export function mapDailyAttendance(data: UnifaAttendanceMy, date?: string): DailyAttendanceResponse {
  const day = date ?? isoDate(new Date().toISOString())
  const classes = data.records
    .filter((r) => isoDate(r.session?.heldAt) === day)
    .map((r) => ({
      id: r.id,
      course: courseRef(r.session?.section?.course ?? { id: r.id, code: '—', title: 'Class', credits: 0 }),
      room: r.session?.section?.room ?? 'TBA',
      instructorName: 'Instructor',
      startsAt: r.session?.heldAt ?? new Date().toISOString(),
      mark: r.status,
    }))
  return { date: day, classes }
}

export function mapCourseAttendance(data: UnifaAttendanceMy, courseId?: string): CourseAttendanceResponse {
  const row = courseId
    ? data.analytics.find((a) => a.course === courseId) ?? data.analytics[0]
    : data.analytics[0]
  const records = data.records.filter((r) => !row || r.session?.section?.course?.code === row.course)
  const course = records[0]?.session?.section?.course
  return {
    course: course
      ? courseRef(course)
      : { id: row?.course ?? '—', code: row?.course ?? '—', title: row?.course ?? 'Course', credits: 0 },
    instructorName: 'Instructor',
    room: records[0]?.session?.section?.room ?? 'TBA',
    percent: row?.percent ?? data.overall,
    requiredPercent: 75,
    sessions: records.map((r) => ({
      id: r.id,
      startsAt: r.session?.heldAt ?? new Date().toISOString(),
      endsAt: r.session?.heldAt ?? new Date().toISOString(),
      mark: r.status,
    })),
    nextSessionAt: null,
  }
}

export function mapAttendanceHistory(data: UnifaAttendanceMy): AttendanceHistoryResponse {
  const present = data.records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
  return {
    terms: [
      {
        termId: 'current',
        termName: 'Current term',
        percent: data.overall,
        attended: present,
        total: data.records.length,
      },
    ],
    insight: data.overall >= 75 ? 'You are above the 75% requirement.' : 'Attendance is below the 75% requirement.',
    computedAt: new Date().toISOString(),
  }
}

export function mapAttendanceAnalytics(data: UnifaAttendanceMy): AttendanceAnalyticsResponse {
  return {
    metrics: [
      metric('Overall', percent(data.overall), data.overall >= 75 ? 'success' : 'danger', 'CalendarCheck', {
        progress: data.overall,
      }),
    ],
    byWeekday: [],
    forecast:
      data.overall >= 75
        ? { headline: 'On track', body: 'You are above the 75% attendance requirement.' }
        : { headline: 'At risk', body: 'Attendance is below the 75% requirement.' },
  }
}

function examSlot(exam: UnifaExam, schedule: UnifaExam['schedules'][0]): ExamSlot {
  const start = new Date(schedule.startsAt)
  const end = new Date(start.getTime() + 2 * 3600000)
  return {
    id: schedule.id,
    course: courseRef(exam.course),
    startsAt: schedule.startsAt,
    endsAt: end.toISOString(),
    venue: schedule.room ?? 'Exam hall',
    room: schedule.room ?? 'TBA',
    seatNo: null,
  }
}

export function mapExamOverview(exams: UnifaExam[]): ExamOverviewResponse {
  const upcoming = exams.filter((e) => e.schedules.some((s) => new Date(s.startsAt) > new Date()))
  return {
    metrics: [
      metric('Exams', String(exams.length), 'brand', 'ClipboardList'),
      metric('Upcoming', String(upcoming.length), 'info', 'Clock'),
    ],
  }
}

export function mapExamSchedule(exams: UnifaExam[]): ExamScheduleResponse {
  const slots = exams.flatMap((e) => e.schedules.map((s) => examSlot(e, s)))
  const next = slots.filter((s) => new Date(s.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  return { exams: slots, nextExamAt: next?.startsAt ?? null }
}

export function mapExamResults(results: UnifaExamResult[]): ExamResultsResponse {
  return {
    termId: 'current',
    termName: 'Current term',
    metrics: [metric('Published', String(results.length), 'success')],
    rows: results.map((r) => ({
      course: courseRef(r.exam.course ?? { id: r.id, code: '—', title: r.exam.title, credits: 0 }),
      category: r.exam.type,
      grade: r.letterGrade ?? null,
      points: num(r.marks),
    })),
    insight: null,
    predictedGpa: null,
  }
}

export function mapGradeReport(transcript: { cgpa: number; enrollments: UnifaEnrollment[] }): GradeReportResponse {
  return {
    completionPercent: transcript.enrollments.length
      ? Math.round((transcript.enrollments.filter((e) => e.letterGrade).length / transcript.enrollments.length) * 100)
      : 0,
    cgpa: transcript.cgpa,
    terms: mapCreditProgress(transcript).perTerm,
    transcriptPdfUrl: null,
  }
}

export function mapExamAnalytics(results: UnifaExamResult[]): ExamAnalyticsResponse {
  return {
    summary: results.length ? `${results.length} published results.` : 'No published results yet.',
    breakdown: [],
    weakest: null,
    recommendations: [],
  }
}

export function mapLmsGradebook(enrollments: UnifaEnrollment[]): GradebookResponse {
  const rows = enrollments.map((e) => ({
    course: courseRef(e.section.course),
    grade: e.letterGrade ?? null,
    points: e.gradePoint == null ? null : num(e.gradePoint),
  }))
  const done = rows.filter((r) => r.grade).length
  return {
    completionPercent: rows.length ? Math.round((done / rows.length) * 100) : 0,
    insight: null,
    rows,
  }
}

export function mapFinanceOverview(invoices: UnifaInvoice[]): FinanceOverviewResponse {
  const outstanding = invoices.filter((i) => i.status !== 'PAID')
  const paid = invoices.filter((i) => i.status === 'PAID')
  const due = outstanding.reduce((n, i) => n + num(i.total), 0)
  const collected = paid.reduce((n, i) => n + num(i.total), 0)
  const next = outstanding.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  return {
    currency: 'BDT',
    metrics: [
      metric('Outstanding', money(due), due ? 'danger' : 'success'),
      metric('Paid', money(collected), 'success'),
      metric('Invoices', String(invoices.length), 'brand'),
    ],
    nextDueAt: next ? isoDate(next.dueDate) : null,
    timeline: invoices.map((i) => ({
      id: i.id,
      label: i.invoiceNo,
      amount: String(i.total),
      dueOn: isoDate(i.dueDate),
      paid: i.status === 'PAID',
    })),
  }
}

export function mapPaymentOptions(invoices: UnifaInvoice[]): PaymentOptionsResponse {
  const open = invoices.filter((i) => i.status !== 'PAID')
  const outstanding = open.reduce((n, i) => n + num(i.total), 0)
  return {
    currency: 'BDT',
    outstanding: String(outstanding),
    minimumPayable: open[0] ? String(open[0].total) : '0',
    termName: open[0]?.semester?.name ?? 'Current term',
    methods: [
      { id: 'BKASH', label: 'bKash', note: 'Mobile wallet', kind: 'MOBILE_BANKING', enabled: true },
      { id: 'NAGAD', label: 'Nagad', note: 'Mobile wallet', kind: 'MOBILE_BANKING', enabled: true },
      { id: 'VISA', label: 'Visa', note: 'Card', kind: 'CARD', enabled: true },
      { id: 'MASTERCARD', label: 'Mastercard', note: 'Card', kind: 'CARD', enabled: true },
      { id: 'CASH', label: 'Cash', note: 'Accounts office', kind: 'BANK_TRANSFER', enabled: true },
    ],
    openInvoices: open.map((i) => ({
      id: i.id,
      title: i.invoiceNo,
      amount: String(i.total),
    })),
  }
}

export function mapPaymentIntent(p: UnifaPayment): PaymentIntent {
  const ok = p.status === 'SUCCESS' || p.status === 'CAPTURED'
  return {
    id: p.id,
    status: ok ? 'SUCCESS' : p.status === 'FAILED' ? 'FAILED' : 'PENDING',
    amount: String(p.amount),
    currency: 'BDT',
    redirectUrl: null,
    reference: p.txnId ?? p.id,
    failureReason: ok ? null : p.status,
    createdAt: p.paidAt ?? new Date().toISOString(),
  }
}

export function mapInvoices(invoices: UnifaInvoice[]): InvoicesResponse {
  const due = invoices.filter((i) => i.status !== 'PAID').reduce((n, i) => n + num(i.total), 0)
  const paid = invoices.filter((i) => i.status === 'PAID').reduce((n, i) => n + num(i.total), 0)
  return {
    currency: 'BDT',
    totals: [
      { label: 'Outstanding', amount: String(due), tone: due ? 'danger' : 'success' },
      { label: 'Paid', amount: String(paid), tone: 'success' },
    ],
    invoices: invoices.map((i) => ({
      id: i.id,
      number: i.invoiceNo,
      title: i.items[0]?.description ?? i.invoiceNo,
      note: i.status,
      amount: String(i.total),
      paid: i.status === 'PAID',
      dueOn: isoDate(i.dueDate),
      pdfUrl: '#',
    })),
  }
}

export function mapFeeStatement(invoices: UnifaInvoice[], me?: UnifaMe | null): FeeStatementResponse {
  const items = invoices.flatMap((i) =>
    i.items.map((it, idx) => ({
      id: `${i.id}-${idx}`,
      label: it.description,
      amount: String(it.amount),
    })),
  )
  const total = invoices.reduce((n, i) => n + num(i.total), 0)
  return {
    currency: 'BDT',
    student: {
      fullName: me ? displayName(me) : 'Student',
      registrationNo: me?.student?.studentNo ?? '—',
      department: me?.student?.department.name ?? '—',
      termName: invoices[0]?.semester?.name ?? 'Current term',
    },
    billing: {
      addressLines: [],
      city: 'Dhaka',
      postcode: '',
      phone: me?.phone ?? '',
      email: me?.email ?? '',
    },
    lines: items,
    total: String(total),
    paid: String(invoices.filter((i) => i.status === 'PAID').reduce((n, i) => n + num(i.total), 0)),
    balance: String(invoices.filter((i) => i.status !== 'PAID').reduce((n, i) => n + num(i.total), 0)),
    pdfUrl: '#',
  }
}

export function mapInstallments(invoices: UnifaInvoice[]): InstallmentsResponse {
  return {
    currency: 'BDT',
    steps: invoices.map((i, idx) => ({
      id: i.id,
      index: idx + 1,
      percentOfTotal: 0,
      label: i.invoiceNo,
      amount: String(i.total),
      state: i.status === 'PAID' ? 'CLEARED' : i.status === 'OVERDUE' ? 'OVERDUE' : 'DUE',
      dueOn: isoDate(i.dueDate),
      clearedOn: i.status === 'PAID' ? isoDate(i.dueDate) : null,
    })),
    tip: null,
  }
}

export function mapPaymentHistory(invoices: UnifaInvoice[]): PaymentHistoryResponse {
  const results = invoices.flatMap((i) =>
    i.payments.map((p) => ({
      id: p.id,
      paidAt: p.paidAt ?? new Date().toISOString(),
      reference: p.txnId ?? p.id,
      methodLabel: p.gateway,
      amount: String(p.amount),
      status: (p.status === 'SUCCESS' || p.status === 'CAPTURED' ? 'SUCCESS' : 'FAILED') as PaymentIntent['status'],
      receiptUrl: null,
    })),
  )
  return {
    currency: 'BDT',
    totalPaid: String(results.reduce((n, r) => n + num(r.amount), 0)),
    count: results.length,
    results,
    nextCursor: null,
  }
}

export function mapLibrary(books: UnifaBook[]): LibraryOverviewResponse {
  const available = books.filter((b) => b.copies.some((c) => !c.status || c.status === 'AVAILABLE'))
  return {
    stats: {
      totalBooks: books.length,
      availableNow: available.length,
      myBorrowedCount: 0,
      overdueCount: 0,
    },
    catalog: books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category ?? 'General',
      isbn: b.isbn,
      location: null,
      availability: b.copies.some((c) => !c.status || c.status === 'AVAILABLE') ? 'AVAILABLE' : 'UNAVAILABLE',
      availableCount: b.copies.filter((c) => !c.status || c.status === 'AVAILABLE').length,
    })),
  }
}

export function mapBorrowed(): LibraryHistoryResponse & MyBorrowedBooksResponse {
  return { outstandingFines: '0', loans: [], activeLoans: [] }
}

const TICKET_STATUS: Record<string, ServiceRequest['status']> = {
  OPEN: 'SUBMITTED',
  IN_REVIEW: 'IN_PROGRESS',
  APPROVED: 'COMPLETED',
  REJECTED: 'CLOSED',
  CLOSED: 'CLOSED',
}

export function mapTicket(t: UnifaTicket): ServiceRequest {
  return {
    id: t.id,
    reference: t.id.slice(-8).toUpperCase(),
    category: t.type,
    subject: t.title ?? t.subject ?? t.type,
    description: t.body,
    priority: 'MEDIUM',
    status: TICKET_STATUS[t.status] ?? 'SUBMITTED',
    assignedDept: null,
    agent: null,
    submittedAt: t.createdAt ?? new Date().toISOString(),
  }
}

export function mapServices(tickets: UnifaTicket[]): StudentServicesResponse {
  const mapped = tickets.map(mapTicket)
  return {
    counts: {
      total: mapped.length,
      inProgress: mapped.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SUBMITTED').length,
      completed: mapped.filter((t) => t.status === 'COMPLETED').length,
      closed: mapped.filter((t) => t.status === 'CLOSED').length,
    },
    recent: mapped.slice(0, 8),
  }
}

export function mapTransport(routes: UnifaRoute[]): TransportOverviewResponse {
  const route = routes[0]
  return {
    route: { name: route?.name ?? 'No route assigned', pickupPoint: route?.description ?? 'Campus' },
    fee: { monthly: String(route?.fare ?? 0), dueDate: isoDate(new Date().toISOString()), paid: '0', due: String(route?.fare ?? 0) },
    attendancePercent: 0,
    vehicle: { number: '—', driver: '—', assistant: '—', pickupTime: '07:00', returnTime: '17:00' },
    stops: (route?.schedules ?? []).map((s, i, arr) => ({
      name: s.stopName ?? `Stop ${i + 1}`,
      time: (s.startTime ?? s.departsAt ?? '07:00').slice(0, 5),
      kind: i === 0 ? 'START' : i === arr.length - 1 ? 'DESTINATION' : 'STOP',
    })),
    routeUpdatedAt: new Date().toISOString(),
  }
}

export function mapHostel(hostels: UnifaHostel[]): HostelOverviewResponse {
  const hostel = hostels[0]
  const room = hostel?.rooms[0]
  return {
    hostel: {
      name: hostel?.name ?? 'No hostel allocated',
      roomNo: room?.roomNo ?? '—',
      roomType: 'Standard',
      floor: '—',
      bedNo: '—',
      photoUrl: null,
      campus: null,
    },
    checkInDate: isoDate(new Date().toISOString()),
    status: room?.allocations?.length ? 'ACTIVE' : 'INACTIVE',
    warden: { name: 'Warden', phone: '—' },
    fee: { hostelFee: '0', messFee: '0', totalPaid: '0', due: '0' },
    roommates: [],
    notices: [],
    contact: { emergencyPhone: '—', email: 'hostel@unifa.edu', office: 'Hostel office' },
  }
}

export function mapCertificates(rows: UnifaCertificate[]): CertificatesResponse {
  return {
    certificates: rows.map((c) => ({
      id: c.id,
      serial: c.id.slice(-8).toUpperCase(),
      title: c.type ?? c.kind ?? 'Certificate',
      issuer: 'UniFa',
      issuedOn: isoDate(c.createdAt),
      downloadUrl: '#',
      verifyUrl: '#',
    })),
    streak: null,
    notices: [],
  }
}

export function mapAiOverview(conversations: UnifaConversation[]): AiOverviewResponse {
  return {
    metrics: [metric('Threads', String(conversations.length), 'accent', 'Sparkles')],
    recentConversations: conversations.slice(0, 6).map((c) => ({
      id: c.id,
      title: c.title ?? 'Conversation',
      snippet: c.messages.at(-1)?.content ?? '',
      updatedAt: c.messages.at(-1)?.createdAt ?? c.createdAt ?? new Date().toISOString(),
    })),
    quickActions: [
      { id: 'cgpa', label: 'CGPA', note: 'What is my CGPA?' },
      { id: 'dues', label: 'Dues', note: 'Which invoices are unpaid?' },
      { id: 'attendance', label: 'Attendance', note: 'How is my attendance?' },
    ],
    trainingStatus: 'Answers are read-only against your UniFa academic records.',
  }
}

export function mapConversation(c: UnifaConversation): AiConversationResponse {
  return {
    id: c.id,
    title: c.title ?? 'Conversation',
    messages: c.messages.map((m) => ({
      id: m.id,
      from: m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'me',
      text: m.content,
      createdAt: m.createdAt ?? new Date().toISOString(),
    })),
  }
}

export function mapAskToMessage(res: UnifaAskResponse) {
  return {
    conversationId: res.conversationId,
    message: {
      id: res.message.id,
      from: 'ai' as const,
      text: res.message.content,
      createdAt: res.message.createdAt ?? new Date().toISOString(),
    },
  }
}

export function mapAdvisor(dash: UnifaStudentDashboard): AiAdvisorResponse {
  return {
    gpa: { current: dash.gpa, target: 4, percent: Math.min(100, Math.round((dash.gpa / 4) * 100)) },
    alerts: [
      ...(dash.dues > 0
        ? [{ id: 'dues', title: 'Outstanding dues', body: `${money(dash.dues)} still payable.` }]
        : []),
      ...(dash.attendance < 75
        ? [{ id: 'att', title: 'Attendance risk', body: `Overall attendance is ${percent(dash.attendance)}.` }]
        : []),
    ],
    stats: [
      { label: 'Courses', value: String(dash.courses) },
      { label: 'Attendance', value: percent(dash.attendance) },
    ],
    plan: dash.enrollments.slice(0, 4).map((e) => ({
      id: e.id,
      title: e.section.course.title,
      body: e.letterGrade ? `Current grade ${e.letterGrade}.` : 'Stay on top of lectures and assignments.',
    })),
    insight: 'Ask the assistant about CGPA, attendance, or unpaid invoices.',
  }
}

export function mapRecommendations(courses: UnifaCourse[]): RecommendationsResponse {
  const primary = courses.slice(0, 3).map((c) => ({
    id: c.id,
    course: courseRef(c),
    matchPercent: 80,
    why: c.description ?? 'From the current catalogue.',
  }))
  return {
    track: 'Your programme',
    primary,
    others: courses.slice(3, 6).map((c) => ({
      id: c.id,
      course: courseRef(c),
      matchPercent: 60,
      why: 'Catalogue option',
    })),
    futureReady: 'Keep prerequisites clear before next registration.',
    advice: 'Use course registration to enrol in an open section.',
  }
}

export function mapQuiz(q: UnifaQuiz): PracticeQuizResponse {
  return {
    id: q.id,
    title: q.title,
    questions: q.questions.map((qq) => ({
      id: qq.id,
      prompt: qq.prompt,
      options: Array.isArray(qq.options)
        ? qq.options.map((opt, i) =>
            typeof opt === 'string' ? { id: String(i), text: opt } : { id: opt.id ?? String(i), text: opt.text },
          )
        : [],
      correctOptionId: null,
    })),
    rankNote: null,
  }
}

export function mapQuizzes(): QuizzesResponse {
  return { quizzes: [], revisionPlan: null }
}

export function mapQuizAttempt(score: number, max = 0): QuizAttemptResult {
  const total = max || 1
  return {
    id: crypto.randomUUID(),
    quizId: '',
    scorePercent: Math.round((score / total) * 100),
    correctCount: score,
    totalCount: total,
    submittedAt: new Date().toISOString(),
    perQuestion: [],
  }
}

export function mapUsers(users: UnifaDirectoryUser[]): UserManagementResponse {
  const results: UserRow[] = users.map((u) => ({
    id: u.id,
    reference: u.id.slice(-6).toUpperCase(),
    fullName: displayName(u),
    email: u.email,
    role: mapRole(u.role) ?? 'admin',
    department: null,
    status: u.status === 'INACTIVE' ? 'DEACTIVATED' : u.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    lastActiveAt: u.lastLoginAt ?? null,
  }))
  return {
    metrics: [
      metric('Users', String(results.length), 'brand', 'Users'),
      metric('Students', String(users.filter((u) => u.role === 'STUDENT').length), 'info'),
      metric('Teachers', String(users.filter((u) => u.role === 'TEACHER').length), 'accent'),
    ],
    count: results.length,
    next: null,
    previous: null,
    results,
  }
}

export function mapResearch(data: UnifaResearch): ResearchPortfolioResponse {
  return {
    metrics: [
      metric('Projects', String(data.projects.length), 'brand', 'FlaskConical'),
      metric('Publications', String(data.publications.length), 'info', 'Award'),
    ],
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
}

export function mapAnnouncements(rows: UnifaAnnouncement[]) {
  return {
    unreadCount: rows.length,
    announcements: rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      course: null,
      authorName: 'Campus',
      authorRole: a.audience ?? 'ALL',
      attachments: [],
      publishedAt: a.createdAt,
      read: false,
      pinned: false,
    })),
  }
}
