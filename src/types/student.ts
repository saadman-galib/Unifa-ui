/**
 * Student persona wire types — one entry per endpoint in docs/api/student.md.
 *
 * Naming: `XxxResponse` is a GET body, `XxxRequest` is a POST/PATCH body.
 * Anything without a suffix is a row/entity reused across several endpoints.
 *
 * Screen-shaped by design: most GETs return everything one screen needs in a
 * single round trip (see docs/api/student.md §2). The AI assistant panel is
 * the deliberate exception — it lives on its own endpoint so a slow model
 * never blocks a page render.
 */

import type {
  Attachment,
  AttendanceMark,
  BadgeTone,
  CourseRef,
  CurrencyCode,
  Id,
  ISODate,
  ISODateTime,
  Instructor,
  LetterGrade,
  Me,
  Metric,
  Money,
  TimeOfDay,
  Tone,
} from './common'

// Re-exported so `import type { CourseRef } from '@/types'` keeps working and
// student screens do not need to know which file an entity lives in.
export type { Attachment, AttendanceMark, CourseRef, Instructor, LetterGrade }

// ===========================================================================
// Shared entities
// ===========================================================================

export type EnrollmentStatus = 'ENROLLED' | 'PENDING' | 'DROPPED' | 'WAITLISTED'

// ===========================================================================
// AI assistant panel  ·  GET /api/student/ai/assist/?context=<key>
// ===========================================================================

/**
 * Every screen that shows an assistant card requests it separately, keyed by
 * `context` (`lms.assignments`, `academic.courses`, …). Slow, cacheable for
 * minutes, and independently failable — a dead model must not blank a page.
 */
export type AssistantResponse = {
  context: string
  title: string | null
  messages: { from: 'ai' | 'me'; text: string; at: ISODateTime }[]
  /** Chips under the panel. Each is a prompt to send back verbatim. */
  suggestions: string[]
}

// ===========================================================================
// Dashboard  ·  GET /api/student/dashboard/
// ===========================================================================

export type Deadline = {
  id: Id
  title: string
  dueAt: ISODateTime
  /** `Canvas Submission` — what the student must do, not when. */
  kind: string
  /** Server-computed against `dueAt` so the badge cannot drift from clock skew. */
  isOverdue: boolean
  /** Deep link into the module that owns it. */
  href: string
}

export type DashboardCourse = {
  course: CourseRef
  instructorName: string
  /** `Room 402`, `Online Sync`, `Hybrid`. */
  mode: string
  status: EnrollmentStatus
  grade: LetterGrade
}

export type StudentDashboardResponse = {
  hero: { badge: string; heading: string; body: string }
  metrics: Metric[]
  deadlines: Deadline[]
  courses: DashboardCourse[]
}

// ===========================================================================
// Academic
// ===========================================================================

/** GET /api/student/academic/courses/ */
export type EnrolledCourse = {
  course: CourseRef
  instructorName: string
  /** 0–100, syllabus completion. */
  progress: number
  grade: LetterGrade
  status: EnrollmentStatus
}

export type MyCoursesResponse = {
  metrics: Metric[]
  courses: EnrolledCourse[]
}

/** GET /api/student/academic/curriculum/ */
export type CurriculumState = 'DONE' | 'IN_PROGRESS' | 'REMAINING'

export type CurriculumEntry = {
  course: CourseRef
  department: string
  state: CurriculumState
}

export type CurriculumResponse = {
  stats: Metric[]
  entries: CurriculumEntry[]
}

/** GET /api/student/academic/degree-progress/ */
export type MilestoneState = 'DONE' | 'CURRENT' | 'UPCOMING'

export type DegreeProgressResponse = {
  buckets: { label: string; note: string; percent: number; tone: Tone }[]
  milestones: { id: Id; title: string; note: string; state: MilestoneState }[]
  nextDeadline: { title: string; dueAt: ISODateTime } | null
  /** Free text from the advising engine; may be empty. */
  forecast: string
}

/** GET /api/student/academic/credits/ */
export type CreditProgressResponse = {
  overall: { earned: number; required: number }
  byCategory: { label: string; earned: number; required: number; tone: Tone }[]
  perTerm: { termId: Id; termName: string; credits: number; gpa: number }[]
}

/** GET /api/student/academic/routine/ */
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type RoutineSlot = {
  id: Id
  day: Weekday
  startsAt: TimeOfDay
  endsAt: TimeOfDay
  course: CourseRef
  room: string
  tone: Tone
}

export type ClassRoutineResponse = {
  /** The week these slots describe, so a cached routine can be spotted as stale. */
  weekOf: ISODate
  slots: RoutineSlot[]
  /** 0–100 — study-goal ring on the routine screen. */
  dailyGoalPercent: number
  recentFiles: { id: Id; filename: string; note: string; url: string }[]
  campusWifiSsid: string | null
}

/** GET /api/student/academic/calendar/?month=YYYY-MM */
export type CalendarEvent = {
  id: Id
  date: ISODate
  label: string
  tone: Tone
  /** `HOLIDAY` | `EXAM` | `REGISTRATION` | `EVENT` — for filtering. */
  kind: string
}

export type AcademicCalendarResponse = {
  /** Echoes the requested `?month=`, so a late response can be discarded. */
  month: string
  events: CalendarEvent[]
}

/** GET /api/student/academic/faculty/ — paginated, `Paginated<FacultyDirectoryEntry>` */
export type FacultyDirectoryEntry = Instructor & {
  department: string
  /** `Mon 14:00–16:00` and friends; display-only, set by the faculty member. */
  officeHours: string | null
}

/** GET /api/student/academic/classrooms/ */
export type Classroom = {
  id: Id
  name: string
  building: string
  floor: string | null
  capacity: number
  /** Null when the room is free right now. */
  currentSession: { title: string; endsAt: ISODateTime } | null
}

export type ClassroomsResponse = { rooms: Classroom[] }

// --------------------------------------------------------- registration

/** GET /api/student/academic/registration/semester/ */
export type RegistrationWindowState = 'OPEN' | 'UPCOMING' | 'CLOSED'
export type AdvisorApprovalState = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

export type SemesterRegistrationResponse = {
  terms: {
    id: Id
    name: string
    state: RegistrationWindowState
    opensAt: ISODateTime
    closesAt: ISODateTime
  }[]
  advisor: Pick<Instructor, 'id' | 'name'> & { department: string }
  selection: {
    courseCount: number
    totalCredits: number
    estimatedFee: Money
    currency: CurrencyCode
  }
  approval: AdvisorApprovalState
}

/** POST /api/student/academic/registration/semester/ */
export type SemesterRegistrationRequest = {
  termId: Id
  offeringIds: Id[]
}

/** GET /api/student/academic/registration/courses/ — `Paginated<CourseOffering>` */
export type CourseOffering = {
  id: Id
  course: CourseRef
  department: string
  section: string
  instructorName: string
  seatsTaken: number
  seatsTotal: number
  /** Prerequisite / workload notice. `tone` drives the pill colour. */
  notice: { text: string; tone: BadgeTone } | null
  /** False when a prerequisite is unmet — disable the Add button, do not hide it. */
  canRegister: boolean
  /** Why not, when `canRegister` is false. */
  blockedReason: string | null
}

/** POST /api/student/academic/registration/courses/ */
export type AddCourseRequest = { offeringId: Id }

/** DELETE /api/student/academic/registration/courses/{offeringId}/ → 204 */

/** GET /api/student/academic/registration/drop-add/ */
export type DropAddResponse = {
  enrolled: {
    offeringId: Id
    course: CourseRef
    instructorName: string
    /** False once the drop deadline passes — the row stays, the button dies. */
    canDrop: boolean
  }[]
  enrolledCredits: number
  fullTimeMinimumCredits: number
  dropDeadline: ISODate
}

/** POST /api/student/academic/registration/drop-add/ */
export type DropAddRequest = {
  action: 'DROP' | 'ADD'
  offeringId: Id
  reason?: string
}

export type DropAddResult = {
  id: Id
  action: 'DROP' | 'ADD'
  offeringId: Id
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: ISODateTime
}

// ===========================================================================
// LMS
// ===========================================================================

export type LmsCourse = {
  course: CourseRef
  instructorName: string
  /** 0–100 */
  progress: number
  grade: LetterGrade
}

/** GET /api/student/lms/overview/ */
export type LmsOverviewResponse = {
  metrics: Metric[]
  courses: LmsCourse[]
}

/** GET /api/student/lms/courses/ */
export type LmsCoursesResponse = {
  termId: Id
  termName: string
  courses: LmsCourse[]
}

// ------------------------------------------------------------ assignments

export type AssignmentState = 'OPEN' | 'DUE_SOON' | 'OVERDUE' | 'SUBMITTED' | 'GRADED'

export type Assignment = {
  id: Id
  title: string
  course: CourseRef
  summary: string
  dueAt: ISODateTime
  state: AssignmentState
  /** Present only when `state === 'GRADED'`. */
  grade: LetterGrade
  submittedAt: ISODateTime | null
}

/** GET /api/student/lms/assignments/?state= */
export type AssignmentsResponse = {
  metrics: Metric[]
  assignments: Assignment[]
}

/** GET /api/student/lms/assignments/{id}/ */
export type AssignmentDetailResponse = {
  id: Id
  title: string
  course: CourseRef
  dueAt: ISODateTime
  brief: string
  requirements: string[]
  integrityNote: string
  maxAttachments: number
  maxAttachmentBytes: number
  acceptedMimeTypes: string[]
  /** The student's current attempt, if any. */
  submission: Submission | null
}

export type SubmissionState = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED'

export type Submission = {
  id: Id
  assignmentId: Id
  state: SubmissionState
  comment: string
  attachments: Attachment[]
  submittedAt: ISODateTime | null
  grade: LetterGrade
  feedback: string | null
}

/**
 * POST /api/student/lms/assignments/{id}/submissions/ — `multipart/form-data`.
 * Typed for the form model, not for `JSON.stringify`; see docs/api/student.md §6.
 */
export type SubmitAssignmentRequest = {
  files: File[]
  comment: string
  integrityAgreed: boolean
}

// ----------------------------------------------------------------- quizzes

export type QuizState = 'AVAILABLE' | 'COMPLETED' | 'LOCKED'

export type Quiz = {
  id: Id
  title: string
  course: CourseRef
  questionCount: number
  durationMinutes: number
  state: QuizState
  /** 0–100, present when `state === 'COMPLETED'`. */
  scorePercent: number | null
  /** Why it is locked — prerequisite quiz, closed window. */
  lockedReason: string | null
}

/** GET /api/student/lms/quizzes/ */
export type QuizzesResponse = {
  quizzes: Quiz[]
  revisionPlan: { title: string; body: string } | null
}

/**
 * GET /api/student/lms/quizzes/{id}/practice/
 *
 * Practice quizzes ship the key so grading is instant and offline-capable.
 * Graded quizzes MUST NOT — see docs/api/student.md §6.4.
 */
export type QuizQuestion = {
  id: Id
  prompt: string
  options: { id: Id; text: string }[]
  /** Practice only. Null on any graded attempt. */
  correctOptionId: Id | null
}

export type PracticeQuizResponse = {
  id: Id
  title: string
  questions: QuizQuestion[]
  rankNote: string | null
}

/** POST /api/student/lms/quizzes/{id}/attempts/ */
export type QuizAttemptRequest = {
  answers: { questionId: Id; optionId: Id }[]
  /** Client-measured, for analytics only — never trusted for enforcement. */
  elapsedSeconds: number
}

export type QuizAttemptResult = {
  id: Id
  quizId: Id
  scorePercent: number
  correctCount: number
  totalCount: number
  submittedAt: ISODateTime
  perQuestion: { questionId: Id; correct: boolean; correctOptionId: Id }[]
}

// --------------------------------------------------- lectures · recordings

export type Lecture = {
  id: Id
  title: string
  durationSeconds: number
  /** Where the student stopped. 0 when never opened. */
  positionSeconds: number
  watched: boolean
  videoUrl: string | null
}

/** GET /api/student/lms/courses/{courseId}/lectures/ */
export type LecturesResponse = {
  courseId: Id
  moduleTitle: string
  summary: string
  lectures: Lecture[]
}

/** POST /api/student/lms/lectures/{id}/progress/ — fire-and-forget, 204. */
export type LectureProgressRequest = {
  positionSeconds: number
  watched: boolean
}

/** GET /api/student/lms/live/ */
export type LiveClassesResponse = {
  live: {
    id: Id
    title: string
    instructorName: string
    startedAt: ISODateTime
    joinUrl: string
  }[]
  upcoming: {
    id: Id
    title: string
    instructorName: string
    startsAt: ISODateTime
  }[]
}

/** GET /api/student/lms/recordings/ */
export type RecordedSession = {
  id: Id
  title: string
  course: CourseRef
  startedAt: ISODateTime
  durationSeconds: number
  videoUrl: string
}

export type RecordingsResponse = {
  metrics: Metric[]
  tip: string | null
  sessions: RecordedSession[]
}

// -------------------------------------------------- materials · downloads

/** GET /api/student/lms/courses/{courseId}/materials/ */
export type MaterialGroup = {
  id: Id
  label: string
  fileCount: number
  totalBytes: number
  tone: Tone
}

export type MaterialsResponse = {
  courseId: Id
  groups: MaterialGroup[]
}

export type DownloadState = 'READY' | 'PREPARING' | 'EXPIRED'

/** GET /api/student/lms/downloads/ */
export type DownloadEntry = {
  id: Id
  filename: string
  course: CourseRef
  sizeBytes: number
  state: DownloadState
  url: string | null
  expiresAt: ISODateTime | null
}

export type DownloadsResponse = { files: DownloadEntry[] }

// ------------------------------------------------------------------- forum

/** GET /api/student/lms/forum/threads/ — `Cursored<ForumThread>` */
export type ForumThread = {
  id: Id
  title: string
  excerpt: string
  course: CourseRef
  authorName: string
  replyCount: number
  pinned: boolean
  lastActivityAt: ISODateTime
}

/** GET /api/student/lms/forum/threads/{id}/ */
export type ForumReply = {
  id: Id
  body: string
  authorName: string
  authorAvatarUrl: string | null
  /** True for the student's own posts — enables edit/delete without a second call. */
  isMine: boolean
  createdAt: ISODateTime
}

export type ForumThreadDetailResponse = {
  thread: ForumThread
  body: string
  replies: ForumReply[]
}

export type CreateThreadRequest = { courseId: Id; title: string; body: string }
export type CreateReplyRequest = { body: string }

// ------------------------------------------------------------------- notes

/** GET /api/student/lms/notes/ — `Paginated<Note>` */
export type Note = {
  id: Id
  title: string
  /** Markdown. Rendered, never injected as HTML. */
  body: string
  tag: string | null
  courseId: Id | null
  updatedAt: ISODateTime
}

export type CreateNoteRequest = { title: string; body: string; tag?: string; courseId?: Id }
export type UpdateNoteRequest = Partial<CreateNoteRequest>

// ---------------------------------------------------- progress · analytics

/** GET /api/student/lms/progress/ */
export type LearningProgressResponse = {
  overallPercent: number
  studyMinutes: number
  streakDays: number
  courses: {
    course: CourseRef
    instructorName: string
    percent: number
    tone: Tone
  }[]
}

/** GET /api/student/lms/analytics/ */
export type LearningAnalyticsResponse = {
  proficiency: { label: string; percent: number; tone: Tone }[]
  insight: string
  milestone: { label: string; value: string }
  focus: { label: string; value: string }
}

// --------------------------------------------------------- announcements

/** GET /api/student/lms/announcements/ */
export type Announcement = {
  id: Id
  title: string
  body: string
  course: CourseRef | null
  authorName: string
  authorRole: string
  attachments: Attachment[]
  publishedAt: ISODateTime
  read: boolean
  pinned: boolean
}

export type AnnouncementsResponse = {
  announcements: Announcement[]
  unreadCount: number
}

/** POST /api/student/lms/announcements/{id}/read/ → 204 */

// --------------------------------------------------------------- gradebook

/** GET /api/student/lms/gradebook/ */
export type GradebookRow = {
  course: CourseRef
  grade: LetterGrade
  /** Grade points, 0.00–4.00. Number, not string — this is arithmetic. */
  points: number | null
}

export type GradebookResponse = {
  completionPercent: number
  insight: { title: string; body: string } | null
  rows: GradebookRow[]
}

// ===========================================================================
// Attendance
// ===========================================================================

/** GET /api/student/attendance/overview/ */
export type AttendanceOverviewResponse = {
  metrics: Metric[]
  today: {
    id: Id
    course: CourseRef
    startsAt: ISODateTime
    endsAt: ISODateTime
    mark: AttendanceMark
  }[]
  streakNote: string | null
}

/** GET /api/student/attendance/daily/?date=YYYY-MM-DD */
export type DailyAttendanceResponse = {
  date: ISODate
  classes: {
    id: Id
    course: CourseRef
    room: string
    instructorName: string
    startsAt: ISODateTime
    mark: AttendanceMark
  }[]
}

/** GET /api/student/attendance/courses/{courseId}/ */
export type CourseAttendanceResponse = {
  course: CourseRef
  instructorName: string
  room: string
  percent: number
  /** Institutional minimum, e.g. 75. Drives the danger threshold in the UI. */
  requiredPercent: number
  sessions: {
    id: Id
    startsAt: ISODateTime
    endsAt: ISODateTime
    mark: AttendanceMark
  }[]
  nextSessionAt: ISODateTime | null
}

/** GET /api/student/attendance/history/ */
export type AttendanceHistoryResponse = {
  terms: {
    termId: Id
    termName: string
    percent: number
    attended: number
    total: number
  }[]
  insight: string | null
  computedAt: ISODateTime
}

/** GET /api/student/attendance/analytics/ */
export type AttendanceAnalyticsResponse = {
  metrics: Metric[]
  byWeekday: { day: string; percent: number }[]
  forecast: { headline: string; body: string } | null
}

// ===========================================================================
// Examinations
// ===========================================================================

export type ExamSlot = {
  id: Id
  course: CourseRef
  startsAt: ISODateTime
  endsAt: ISODateTime
  venue: string
  room: string
  seatNo: string | null
}

/** GET /api/student/exams/overview/ */
export type ExamOverviewResponse = { metrics: Metric[] }

/** GET /api/student/exams/schedule/ */
export type ExamScheduleResponse = {
  exams: ExamSlot[]
  /** Absolute instant — the countdown is computed client-side so it ticks. */
  nextExamAt: ISODateTime | null
}

/** GET /api/student/exams/upcoming/ */
export type UpcomingExamsResponse = { exams: ExamSlot[] }

/** GET /api/student/exams/admit-card/?termId= */
export type AdmitCardResponse = {
  /** Null when fees are unpaid or attendance is short — render the reason. */
  card: {
    candidateName: string
    registrationNo: string
    programme: string
    department: string
    examCenter: string
    issuedOn: ISODate
    photoUrl: string | null
    /** Verification QR payload; render, do not parse. */
    qrData: string
    pdfUrl: string
  } | null
  blockedReason: string | null
  exams: ExamSlot[]
  readinessPercent: number | null
}

/** GET /api/student/exams/results/?termId= */
export type ExamResultsResponse = {
  termId: Id
  termName: string
  metrics: Metric[]
  rows: {
    course: CourseRef
    category: string
    grade: LetterGrade
    points: number | null
  }[]
  insight: string | null
  predictedGpa: number | null
}

/** GET /api/student/exams/grade-report/ */
export type GradeReportResponse = {
  completionPercent: number
  cgpa: number
  terms: { termId: Id; termName: string; gpa: number; credits: number }[]
  transcriptPdfUrl: string | null
}

/** GET /api/student/exams/revaluation/ */
export type RevaluationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export type RevaluationRequestRow = {
  id: Id
  course: CourseRef
  examType: string
  reviewType: string
  status: RevaluationStatus
  submittedAt: ISODateTime
  fee: Money
  outcome: string | null
}

export type RevaluationResponse = {
  /** Only courses inside the appeal window. Empty means nothing is appealable. */
  eligibleCourses: CourseRef[]
  examTypes: { id: Id; label: string }[]
  reviewTypes: { id: Id; label: string; fee: Money }[]
  requests: RevaluationRequestRow[]
  windowClosesAt: ISODateTime | null
}

/** POST /api/student/exams/revaluation/ */
export type CreateRevaluationRequest = {
  courseId: Id
  examTypeId: Id
  reviewTypeId: Id
  reason: string
}

/** GET /api/student/exams/attendance/ */
export type ExamAttendanceResponse = {
  exam: ExamSlot | null
  entries: { id: Id; label: string; at: ISODateTime | null; done: boolean }[]
}

/** GET /api/student/exams/analytics/ */
export type ExamAnalyticsResponse = {
  summary: string
  breakdown: { label: string; percent: number; tone: Tone }[]
  weakest: { title: string; note: string } | null
  recommendations: string[]
}

// ===========================================================================
// Finance
// ===========================================================================

/** GET /api/student/finance/overview/ */
export type FinanceOverviewResponse = {
  currency: CurrencyCode
  metrics: Metric[]
  nextDueAt: ISODate | null
  timeline: {
    id: Id
    label: string
    amount: Money
    dueOn: ISODate
    paid: boolean
  }[]
}

export type PaymentMethod = {
  id: Id
  label: string
  note: string
  /** `MOBILE_BANKING` | `CARD` | `BANK_TRANSFER` — drives the icon and flow. */
  kind: string
  enabled: boolean
}

/** GET /api/student/finance/payment-options/ */
export type PaymentOptionsResponse = {
  currency: CurrencyCode
  outstanding: Money
  /** Refuse anything below this; partial payments are policy-gated. */
  minimumPayable: Money
  termName: string
  methods: PaymentMethod[]
  openInvoices: { id: Id; title: string; amount: Money }[]
}

/**
 * POST /api/student/finance/payments/
 *
 * `idempotencyKey` is a client-generated UUID, held for the life of the
 * attempt. Retrying with the same key returns the original intent instead of
 * charging twice. This is the one place the frontend MUST NOT be optimistic.
 */
export type CreatePaymentRequest = {
  amount: Money
  methodId: Id
  invoiceIds: Id[]
  idempotencyKey: string
}

export type PaymentStatus = 'PENDING' | 'REDIRECT_REQUIRED' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export type PaymentIntent = {
  id: Id
  status: PaymentStatus
  amount: Money
  currency: CurrencyCode
  /** Gateway hand-off. Present only when `status === 'REDIRECT_REQUIRED'`. */
  redirectUrl: string | null
  reference: string | null
  failureReason: string | null
  createdAt: ISODateTime
}

/** GET /api/student/finance/statement/?termId= */
export type FeeStatementResponse = {
  currency: CurrencyCode
  student: {
    fullName: string
    registrationNo: string
    department: string
    termName: string
  }
  billing: {
    addressLines: string[]
    city: string
    postcode: string
    phone: string
    email: string
  }
  lines: { id: Id; label: string; amount: Money }[]
  paid: Money
  total: Money
  balance: Money
  pdfUrl: string
}

/** GET /api/student/finance/invoices/ */
export type Invoice = {
  id: Id
  /** `INV-4401` — human reference, distinct from `id`. */
  number: string
  title: string
  note: string
  amount: Money
  paid: boolean
  dueOn: ISODate
  pdfUrl: string
}

export type InvoicesResponse = {
  currency: CurrencyCode
  totals: { label: string; amount: Money; tone: Tone }[]
  invoices: Invoice[]
}

/** GET /api/student/finance/installments/ */
export type InstallmentState = 'CLEARED' | 'DUE' | 'UPCOMING' | 'OVERDUE'

export type InstallmentsResponse = {
  currency: CurrencyCode
  steps: {
    id: Id
    /** 1-based; the UI renders "Step 2: 30%". */
    index: number
    percentOfTotal: number
    label: string
    amount: Money
    state: InstallmentState
    dueOn: ISODate
    clearedOn: ISODate | null
  }[]
  tip: string | null
}

/** GET /api/student/finance/history/ — `Cursored<PaymentRecord>` */
export type PaymentRecord = {
  id: Id
  paidAt: ISODateTime
  reference: string
  methodLabel: string
  amount: Money
  status: PaymentStatus
  receiptUrl: string | null
}

export type PaymentHistoryResponse = {
  currency: CurrencyCode
  totalPaid: Money
  count: number
  results: PaymentRecord[]
  nextCursor: string | null
}

// ===========================================================================
// AI
// ===========================================================================

/** GET /api/student/ai/overview/ */
export type AiOverviewResponse = {
  metrics: Metric[]
  recentConversations: { id: Id; title: string; snippet: string; updatedAt: ISODateTime }[]
  quickActions: { id: Id; label: string; note: string }[]
  trainingStatus: string
}

export type AiMessage = {
  id: Id
  from: 'ai' | 'me'
  text: string
  createdAt: ISODateTime
  /** True while an assistant message is still streaming in. */
  pending?: boolean
}

/** GET /api/student/ai/conversations/{id}/ */
export type AiConversationResponse = {
  id: Id
  title: string
  messages: AiMessage[]
}

/**
 * POST /api/student/ai/conversations/{id}/messages/
 *
 * Responds `text/event-stream`, not JSON — `apiFetch` cannot be used. See
 * docs/api/student.md §7.2 for the streaming reader.
 */
export type SendAiMessageRequest = { text: string; attachmentIds?: Id[] }

/** One SSE `data:` frame from the message stream. */
export type AiStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; messageId: Id }
  | { type: 'error'; message: string }

/** POST /api/student/ai/study-planner/ */
export type StudyPlannerRequest = {
  examId: Id
  targetGrade: string
  dailyHours: number
}

export type StudyPlanResponse = {
  id: Id
  nextExamAt: ISODateTime
  days: {
    date: ISODate
    topic: string
    blocks: { startsAt: TimeOfDay; durationMinutes: number | null; note: string }[]
  }[]
}

/** GET /api/student/ai/study-planner/options/ */
export type StudyPlannerOptionsResponse = {
  exams: { id: Id; label: string; startsAt: ISODateTime }[]
  targetGrades: string[]
  dailyHourChoices: number[]
}

/** POST /api/student/ai/notes/ */
export type GenerateNoteRequest = {
  topic: string
  courseId?: Id
  depth: 'BRIEF' | 'STANDARD' | 'DEEP'
}

export type GeneratedNoteResponse = {
  id: Id
  title: string
  tableOfContents: string[]
  intro: string
  keyFacts: { formula: string; note: string }[]
  generatedAt: ISODateTime
}

/** POST /api/student/ai/quiz/ */
export type GenerateQuizRequest = {
  courseId: Id
  questionCount: number
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export type GeneratedQuizResponse = {
  id: Id
  questions: QuizQuestion[]
  insight: string | null
}

/** GET /api/student/ai/quiz/options/ */
export type QuizGeneratorOptionsResponse = {
  courses: CourseRef[]
  questionCounts: number[]
  types: { id: string; label: string }[]
  difficulties: { id: string; label: string }[]
  focus: { courseId: Id; courseName: string; streakNote: string } | null
}

/** POST /api/student/ai/assignment-helper/ */
export type AssignmentHelperRequest = {
  assignmentId: Id
  draft: string
}

export type AssignmentHelperResponse = {
  outline: string[]
  rewrittenDraft: string
  suggestions: { id: Id; text: string; kind: 'STYLE' | 'CITATION' | 'STRUCTURE' }[]
}

/** GET /api/student/ai/advisor/ */
export type AiAdvisorResponse = {
  gpa: { current: number; target: number; percent: number }
  alerts: { id: Id; title: string; body: string }[]
  stats: { label: string; value: string }[]
  plan: { id: Id; title: string; body: string }[]
  insight: string
}

/** GET /api/student/ai/recommendations/ */
export type CourseRecommendation = {
  id: Id
  course: CourseRef
  /** 0–100. The UI renders "96% Match"; the server owns the model. */
  matchPercent: number
  why: string | null
}

export type RecommendationsResponse = {
  track: string
  primary: CourseRecommendation[]
  others: CourseRecommendation[]
  futureReady: string
  advice: string
}

// ===========================================================================
// Certificates
// ===========================================================================

/** GET /api/student/certificates/ */
export type Certificate = {
  id: Id
  /** `CERT-892014` — printed on the document, shown to employers. */
  serial: string
  title: string
  issuer: string
  issuedOn: ISODate
  downloadUrl: string
  /** Public verification page; safe to share. */
  verifyUrl: string
}

export type CertificatesResponse = {
  certificates: Certificate[]
  streak: { days: number; note: string } | null
  notices: { id: Id; title: string; body: string }[]
}

/** POST /api/student/certificates/print-orders/ */
export type PrintOrderRequest = {
  certificateIds: Id[]
  deliveryAddress: string
  copies: number
}

export type PrintOrder = {
  id: Id
  status: 'PENDING' | 'PRINTING' | 'SHIPPED' | 'DELIVERED'
  fee: Money
  createdAt: ISODateTime
}

// ===========================================================================
// Profile  ·  GET /api/student/profile/
// ===========================================================================

export type DocumentCategory = 'IDENTIFICATION' | 'ACADEMIC' | 'FINANCIAL' | 'MEDICAL'
export type DocumentStatus = 'VERIFIED' | 'PENDING'

/** A profile document — `Attachment` plus the filing metadata Documents shows. */
export type ProfileDocument = Attachment & {
  category: DocumentCategory
  status: DocumentStatus
}

export type ActivityCategory = 'ACADEMIC' | 'SECURITY' | 'SYSTEM'

export type ActivityEntry = {
  id: Id
  title: string
  detail: string | null
  category: ActivityCategory
  at: ISODateTime
}

export type EmergencyContact = { name: string; relationship: string; phone: string }

export type AcademicStanding = {
  faculty: string | null
  advisor: Instructor | null
  admissionDate: ISODate | null
  expectedGraduation: ISODate | null
  campus: string | null
  enrollmentStatus: string
}

/**
 * Everything the 4 profile tabs need in one round trip. Extends `Me` — the
 * identity fields the JWT claims already summarise — rather than refetching
 * them, so the page costs one request, not two.
 */
export type ProfileResponse = Me & {
  status: 'ACTIVE' | 'INACTIVE'
  bloodGroup: string | null
  nationalId: string | null
  dateOfBirth: ISODate | null
  gender: string | null
  phone: string | null
  alternatePhone: string | null
  presentAddress: string | null
  permanentAddress: string | null
  emergencyContact: EmergencyContact | null
  academic: AcademicStanding
  documents: ProfileDocument[]
  activity: ActivityEntry[]
}

/** PATCH /api/student/profile/ — self-editable subset; everything else is the registrar's. */
export type UpdateProfileRequest = Partial<{
  phone: string
  alternatePhone: string
  presentAddress: string
  permanentAddress: string
  emergencyContact: EmergencyContact
}>

// ---------------------------------------------------------------- security

export type ProfileSession = {
  id: Id
  deviceLabel: string
  location: string | null
  lastSeenAt: ISODateTime
  isCurrent: boolean
}

/** GET /api/student/profile/security/ */
export type SecurityResponse = {
  twoFactorEnabled: boolean
  smsRecoveryPhone: string | null
  authenticatorConfigured: boolean
  sessions: ProfileSession[]
}

export type ChangePasswordRequest = { currentPassword: string; newPassword: string }

// ===========================================================================
// Service requests — shared by Student Services, Transport, Hostel
// ===========================================================================

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type RequestStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'

/**
 * One shape for every ticket a student can raise — a Student Services
 * document request, a Transport route change, a Hostel leave request. Each
 * domain scopes its own list/create endpoint; none gets its own type,
 * because the frames themselves are the same form wearing a different
 * category list.
 */
export type ServiceRequest = {
  id: Id
  /** `SR-2025-0012` — shown everywhere the id is, never the raw id. */
  reference: string
  category: string
  subject: string
  description: string
  priority: RequestPriority
  status: RequestStatus
  assignedDept: string | null
  agent: Instructor | null
  submittedAt: ISODateTime
}

export type CreateServiceRequestRequest = {
  category: string
  priority: RequestPriority
  subject: string
  description: string
}

export type ServiceRequestsResponse = { requests: ServiceRequest[] }

// ===========================================================================
// Library
// ===========================================================================

export type BookAvailability = 'AVAILABLE' | 'DIGITAL' | 'UNAVAILABLE'

export type LibraryBook = {
  id: Id
  title: string
  author: string
  category: string
  isbn: string
  /** `Shelf C4, Section 2` or `E-Library Access`. Null when unavailable. */
  location: string | null
  availability: BookAvailability
  availableCount: number
}

/** GET /api/student/library/?q=&category= */
export type LibraryOverviewResponse = {
  stats: { totalBooks: number; availableNow: number; myBorrowedCount: number; overdueCount: number }
  catalog: LibraryBook[]
}

export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'LATE_RETURN'

export type BookLoan = {
  id: Id
  book: { title: string; author: string; isbn: string }
  borrowedAt: ISODate
  dueAt: ISODate
  returnedAt: ISODate | null
  status: LoanStatus
  fine: Money | null
  shelfLocation: string | null
}

/** GET /api/student/library/borrowed/ */
export type MyBorrowedBooksResponse = { activeLoans: BookLoan[] }

/** GET /api/student/library/history/ */
export type LibraryHistoryResponse = { outstandingFines: Money; loans: BookLoan[] }

/** POST /api/student/library/borrowed/{loanId}/renew/ */
export type RenewLoanResult = { loan: BookLoan; summary: string }

export type BookAcquisitionRequest = {
  title: string
  author: string
  category: string
  isbn?: string
  publisher?: string
  publicationYear?: string
  reason: string
}

export type LibraryFeedbackRequest = { topic: string; subject: string; description: string }

// ===========================================================================
// Student Services
// ===========================================================================

/** GET /api/student/services/ */
export type StudentServicesResponse = {
  counts: { total: number; inProgress: number; completed: number; closed: number }
  recent: ServiceRequest[]
}

// ===========================================================================
// Transport
// ===========================================================================

export type RouteStopKind = 'START' | 'STOP' | 'DESTINATION'

export type RouteStop = { name: string; time: TimeOfDay; kind: RouteStopKind }

/** GET /api/student/transport/ */
export type TransportOverviewResponse = {
  route: { name: string; pickupPoint: string }
  fee: { monthly: Money; dueDate: ISODate; paid: Money; due: Money }
  attendancePercent: number
  vehicle: { number: string; driver: string; assistant: string; pickupTime: TimeOfDay; returnTime: TimeOfDay }
  stops: RouteStop[]
  /** When the stop timeline was last confirmed — stands in for live GPS, which this mock has no vehicle to back. */
  routeUpdatedAt: ISODateTime
}

export type TransportPaymentStatus = 'PAID' | 'DUE' | 'OVERDUE'

export type TransportPayment = {
  id: Id
  /** `May 2026` */
  month: string
  amount: Money
  paidAt: ISODateTime | null
  status: TransportPaymentStatus
}

/** GET /api/student/transport/payments/ */
export type TransportPaymentHistoryResponse = { payments: TransportPayment[] }

// ===========================================================================
// Hostel
// ===========================================================================

export type Roommate = { id: Id; name: string; bedNo: string; department: string; phone: string | null; avatarUrl: string | null }

/** GET /api/student/hostel/ — also backs the Room Details screen. */
export type HostelOverviewResponse = {
  hostel: { name: string; roomNo: string; roomType: string; floor: string; bedNo: string; photoUrl: string | null; campus: string | null }
  checkInDate: ISODate
  status: 'ACTIVE' | 'INACTIVE'
  warden: { name: string; phone: string }
  fee: { hostelFee: Money; messFee: Money; totalPaid: Money; due: Money }
  roommates: Roommate[]
  notices: { id: Id; title: string; at: ISODateTime }[]
  contact: { emergencyPhone: string; email: string; office: string }
}

export type HostelFeeKind = 'HOSTEL_FEE' | 'MESS_FEE'
export type HostelPaymentStatus = 'PAID' | 'DUE' | 'OVERDUE'

export type HostelPayment = {
  id: Id
  kind: HostelFeeKind
  amount: Money
  dueAt: ISODate
  paidAt: ISODateTime | null
  status: HostelPaymentStatus
}

/** GET /api/student/hostel/ledger/ */
export type HostelLedgerResponse = { payments: HostelPayment[] }
