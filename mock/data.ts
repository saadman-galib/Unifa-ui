/**
 * Student mock payloads for the dev server.
 *
 * Typed against `src/types` — that is the point. If the contract changes and
 * this file stops compiling, the mock and the doc cannot silently diverge.
 *
 * Content is carried over from the Figma-transcribed fixtures in
 * `src/features/*\/api.ts`, reshaped onto the wire contract: ISO instants
 * instead of `'Oct 24, 2023'`, decimal strings instead of floats, ids on
 * everything a mutation can touch.
 *
 * Anything time-sensitive is anchored to "now" so the dev UI never looks
 * stale — deadlines stay due, the live class stays live.
 */

import type {
  AcademicCalendarResponse,
  AiAdvisorResponse,
  AiConversationResponse,
  AiOverviewResponse,
  AnnouncementsResponse,
  AssignmentDetailResponse,
  AssignmentHelperResponse,
  AssignmentsResponse,
  AttendanceAnalyticsResponse,
  AttendanceHistoryResponse,
  AttendanceOverviewResponse,
  Certificate,
  CertificatesResponse,
  ClassRoutineResponse,
  ClassroomsResponse,
  CourseAttendanceResponse,
  CourseOffering,
  CourseRef,
  CreditProgressResponse,
  CurriculumResponse,
  DailyAttendanceResponse,
  DegreeProgressResponse,
  DownloadsResponse,
  DropAddResponse,
  ExamAnalyticsResponse,
  ExamAttendanceResponse,
  ExamOverviewResponse,
  ExamResultsResponse,
  ExamScheduleResponse,
  ExamSlot,
  FacultyDirectoryEntry,
  FeeStatementResponse,
  FinanceOverviewResponse,
  ForumThread,
  ForumThreadDetailResponse,
  GeneratedNoteResponse,
  GradeReportResponse,
  GradebookResponse,
  InstallmentsResponse,
  InvoicesResponse,
  LearningAnalyticsResponse,
  LearningProgressResponse,
  LecturesResponse,
  LiveClassesResponse,
  LmsCourse,
  LmsCoursesResponse,
  LmsOverviewResponse,
  MaterialsResponse,
  Me,
  MyCoursesResponse,
  Note,
  PaymentHistoryResponse,
  PaymentOptionsResponse,
  PracticeQuizResponse,
  ProfileResponse,
  QuizGeneratorOptionsResponse,
  QuizzesResponse,
  RecommendationsResponse,
  RecordingsResponse,
  RevaluationResponse,
  SecurityResponse,
  SemesterRegistrationResponse,
  StudentDashboardResponse,
  StudyPlannerOptionsResponse,
  StudyPlanResponse,
  Term,
  UpcomingExamsResponse,
} from '../src/types/index.ts'

// ------------------------------------------------------------- time anchors

const DAY = 86_400_000
const HOUR = 3_600_000

const iso = (ms: number) => new Date(ms).toISOString()
/** `+2.5` days from now, as an ISO instant. */
export const inDays = (n: number) => iso(Date.now() + n * DAY)
export const inHours = (n: number) => iso(Date.now() + n * HOUR)
/** Date-only, n days from now. */
export const dayIn = (n: number) => inDays(n).slice(0, 10)

// ------------------------------------------------------------------- terms

export const TERM: Term = {
  id: 'term-2026-spring',
  name: 'Spring 2026',
  startsOn: '2026-01-12',
  endsOn: '2026-05-29',
  isCurrent: true,
}

const PAST_TERMS: Term[] = [
  { id: 'term-2025-fall', name: 'Fall 2025', startsOn: '2025-08-18', endsOn: '2025-12-19', isCurrent: false },
  { id: 'term-2025-summer', name: 'Summer 2025', startsOn: '2025-05-05', endsOn: '2025-07-25', isCurrent: false },
  { id: 'term-2025-spring', name: 'Spring 2025', startsOn: '2025-01-13', endsOn: '2025-05-30', isCurrent: false },
]

// ----------------------------------------------------------------- courses

const c = (id: string, code: string, title: string, credits: number): CourseRef => ({
  id,
  code,
  title,
  credits,
})

export const COURSES = {
  algorithms: c('crs-1', 'CS-401', 'Advanced Algorithms', 3),
  distributed: c('crs-2', 'CS-455', 'Distributed Systems', 3),
  ml: c('crs-3', 'CS-470', 'Machine Learning Foundations', 3),
  linalg: c('crs-4', 'MA-210', 'Linear Algebra & Matrices', 4),
  ethics: c('crs-5', 'PH-101', 'Digital Ethics', 2),
  advml: c('crs-6', 'CS-602', 'Advanced Machine Learning', 3),
  cloud: c('crs-7', 'CS-510', 'Cloud Infrastructure', 3),
  hci: c('crs-8', 'CS-402', 'Human Computer Interaction', 3),
  dsa: c('crs-9', 'CS-301', 'Data Structures & Algorithms', 3),
  dbms: c('crs-10', 'CS-204', 'Database Management Systems', 3),
  networks: c('crs-11', 'CS-202', 'Computer Networks', 3),
  discrete: c('crs-12', 'MA-202', 'Discrete Mathematics', 3),
  ai: c('crs-13', 'CS-405', 'Artificial Intelligence', 3),
  comms: c('crs-14', 'GE-120', 'Technical Communications', 2),
} as const

// ===========================================================================
// Identity
// ===========================================================================

export const ME: Me = {
  id: 'stu-0891',
  role: 'student',
  fullName: 'Adnan Rahman Chowdhury',
  email: 'a.rahman.cs@unigpt.edu',
  avatarUrl: null,
  registrationNo: '21-44390-1',
  department: 'Computer Science & Engineering',
  programme: 'B.Sc. in Artificial Intelligence',
  currentTerm: TERM,
}

// ===========================================================================
// Dashboard
// ===========================================================================

export const DASHBOARD: StudentDashboardResponse = {
  hero: {
    badge: 'Semester Active',
    heading: `Welcome back, ${ME.fullName.split(' ')[0]}`,
    body: 'Your current semester progress is 74%. Two deadlines are due this week.',
  },
  metrics: [
    { label: 'Cumulative GPA', value: '3.88', tone: 'brand', icon: 'GraduationCap' },
    { label: 'Total Credits', value: '104', unit: '/ 120', tone: 'accent', icon: 'Award', progress: 86 },
    { label: 'Attendance', value: '92%', tone: 'info', icon: 'CalendarCheck' },
    { label: 'Active Courses', value: '05', tone: 'brand', icon: 'BookOpen' },
    { label: 'Due This Week', value: '02', tone: 'warning', icon: 'ClipboardList' },
    { label: 'Fees Cleared', value: '100%', tone: 'success', icon: 'Wallet' },
  ],
  deadlines: [
    {
      id: 'dl-1',
      title: 'Algorithm Analysis Quiz',
      dueAt: inDays(-1),
      kind: 'Canvas Submission',
      isOverdue: true,
      href: '/student/lms/quizzes',
    },
    {
      id: 'dl-2',
      title: 'LMS Ethics Essay',
      dueAt: inDays(4),
      kind: 'Turnitin Check Required',
      isOverdue: false,
      href: '/student/lms/assignments',
    },
  ],
  courses: [
    { course: COURSES.algorithms, instructorName: 'Prof. Sarah Jenkins', mode: 'Room 402', status: 'ENROLLED', grade: 'A-' },
    { course: COURSES.ml, instructorName: 'Dr. Michael Chen', mode: 'Online Sync', status: 'ENROLLED', grade: 'B+' },
    { course: COURSES.ethics, instructorName: 'Prof. Alistair Vance', mode: 'Hybrid', status: 'PENDING', grade: null },
  ],
}

// ===========================================================================
// AI assistant panels, keyed by screen context
// ===========================================================================

const assist = (title: string | null, text: string, suggestions: string[] = []) => ({
  title,
  messages: [{ from: 'ai' as const, text, at: inHours(-1) }],
  suggestions,
})

export const ASSISTANTS: Record<string, ReturnType<typeof assist>> = {
  'student.dashboard': assist(
    null,
    'Start with Recursion — it is 40% of the Algorithms quiz on the 24th.',
    ['Plan my week', 'Summarise lecture 04', 'Practice quiz'],
  ),
  'academic.courses': assist(
    null,
    'You have a Distributed Systems quiz coming up in 2 days. Would you like a summary of the last 3 lectures?',
    ['Summarise lectures', 'Show my grades'],
  ),
  'academic.curriculum': assist(
    null,
    'Based on your current progress in Algorithms, I recommend picking Artificial Intelligence as an elective next semester.',
  ),
  'academic.routine': assist(
    null,
    'You have a quiz in Neural Networks today. Would you like to review the lecture notes?',
    ['Review notes', 'Set a reminder'],
  ),
  'academic.faculty': assist(
    'Directory Assistant',
    "Need help finding a professor's office? Ask me things like 'Where is Dr. Ahmed's office?'",
    ['Where is Dr. Ahmed?', 'Who teaches AI?', 'Draft an email'],
  ),
  'academic.classrooms': assist(
    null,
    "I've found 3 available labs in Building A that match your 2:00 PM session requirements.",
    ['Reserve Lab 3', 'Show free rooms'],
  ),
  'academic.drop-add': assist(
    null,
    'You have 10 credits enrolled. To stay full-time you need 2 more. Machine Learning (CS-405) fits your Monday gap.',
    ['Add CS-405', 'Show my gaps'],
  ),
  'lms.assignments': assist(
    'Need help with CS-602?',
    "Your CNN assignment is overdue. I've found 4 peer-reviewed sources and 2 lecture videos from Week 7.",
    ['Show sources', 'Draft an outline'],
  ),
  'lms.assignment-detail': assist(
    'Need help with code?',
    'Check your Binary Search Tree balancing logic (AVL/Red-Black) — it carries 40% of the marks.',
  ),
  'attendance.overview': assist(
    null,
    'Your attendance in Database Systems dropped by 5% this week. Schedule a review session?',
    ['Schedule review', 'Show weak courses'],
  ),
  'attendance.by-course': assist(
    null,
    "I've analysed your attendance for CS-301. You are safely above the 75% mandatory threshold.",
  ),
  'exams.schedule': assist(
    null,
    'You have a 48-hour gap between your first and second exams. Recommended study session: 6 hrs/day.',
  ),
}

// ===========================================================================
// Academic
// ===========================================================================

export const MY_COURSES: MyCoursesResponse = {
  metrics: [
    { label: 'Enrolled Courses', value: '6', tone: 'brand' },
    { label: 'In Progress', value: '5', tone: 'accent' },
    { label: 'Credits This Term', value: '12', tone: 'info' },
    { label: 'Assessments Due', value: '18', tone: 'warning' },
  ],
  courses: [
    { course: COURSES.algorithms, instructorName: 'Prof. Sarah Jenkins', progress: 78, grade: 'A-', status: 'ENROLLED' },
    { course: COURSES.distributed, instructorName: 'Dr. Michael Chen', progress: 64, grade: 'B+', status: 'ENROLLED' },
    { course: COURSES.ml, instructorName: 'Dr. Michael Chen', progress: 52, grade: 'B+', status: 'ENROLLED' },
    { course: COURSES.linalg, instructorName: 'Prof. Michael Chen', progress: 88, grade: 'A', status: 'ENROLLED' },
    { course: COURSES.ethics, instructorName: 'Prof. Alistair Vance', progress: 0, grade: null, status: 'PENDING' },
  ],
}

export const CURRICULUM: CurriculumResponse = {
  stats: [
    { label: 'Degree Completion', value: '74%', tone: 'brand', progress: 74 },
    { label: 'Remaining', value: '16', tone: 'warning' },
    { label: 'In Progress', value: '5', tone: 'accent' },
  ],
  entries: [
    { course: COURSES.algorithms, department: 'Dept. of Computer Science', state: 'IN_PROGRESS' },
    { course: c('crs-15', 'CS-320', 'Operating Systems', 3), department: 'Dept. of Computer Science', state: 'DONE' },
    { course: COURSES.linalg, department: 'Dept. of Mathematics', state: 'DONE' },
    { course: COURSES.dbms, department: 'Dept. of Computer Science', state: 'REMAINING' },
  ],
}

export const DEGREE_PROGRESS: DegreeProgressResponse = {
  buckets: [
    { label: 'Core Credits', note: '24 more credits to core completion', percent: 68, tone: 'brand' },
    { label: 'Elective Credits', note: 'Choose 3 more elective modules', percent: 45, tone: 'accent' },
    { label: 'General Education', note: 'Global Perspective req. pending', percent: 82, tone: 'info' },
  ],
  milestones: [
    { id: 'ms-1', title: 'Year 1: Foundations', note: 'Completed • 4.0 GPA', state: 'DONE' },
    { id: 'ms-2', title: 'Year 2: Core Engineering', note: 'Completed • 3.8 GPA', state: 'DONE' },
    { id: 'ms-3', title: 'Year 3: Specialization', note: 'Enrolled in 5 advanced modules including Neural Networks.', state: 'CURRENT' },
    { id: 'ms-4', title: 'Year 4: Capstone & Ethics', note: 'Eligible for the Early Graduation pathway.', state: 'UPCOMING' },
  ],
  nextDeadline: { title: 'Capstone Proposal Deadline', dueAt: inDays(120) },
  forecast: 'At your current pace you are on track to graduate with Honors in June 2027.',
}

export const CREDIT_PROGRESS: CreditProgressResponse = {
  overall: { earned: 104, required: 120 },
  byCategory: [
    { label: 'Core', earned: 52, required: 64, tone: 'brand' },
    { label: 'Electives', earned: 27, required: 36, tone: 'accent' },
    { label: 'General Education', earned: 25, required: 20, tone: 'info' },
  ],
  perTerm: [
    { termId: PAST_TERMS[2]!.id, termName: 'Spring 2025', credits: 15, gpa: 3.88 },
    { termId: PAST_TERMS[1]!.id, termName: 'Summer 2025', credits: 17, gpa: 3.9 },
    { termId: PAST_TERMS[0]!.id, termName: 'Fall 2025', credits: 18, gpa: 3.86 },
    { termId: TERM.id, termName: TERM.name, credits: 18, gpa: 3.82 },
  ],
}

export const ROUTINE: ClassRoutineResponse = {
  weekOf: dayIn(0),
  slots: [
    { id: 'sl-1', day: 'MON', startsAt: '09:00', endsAt: '10:30', course: COURSES.algorithms, room: 'Room 402', tone: 'brand' },
    { id: 'sl-2', day: 'MON', startsAt: '11:00', endsAt: '12:30', course: COURSES.linalg, room: 'Room 210', tone: 'accent' },
    { id: 'sl-3', day: 'TUE', startsAt: '10:00', endsAt: '12:00', course: COURSES.ml, room: 'Lab 3', tone: 'info' },
    { id: 'sl-4', day: 'WED', startsAt: '09:00', endsAt: '10:30', course: COURSES.distributed, room: 'Room 402', tone: 'brand' },
    { id: 'sl-5', day: 'THU', startsAt: '14:00', endsAt: '15:30', course: COURSES.ethics, room: 'Auditorium B', tone: 'warning' },
    { id: 'sl-6', day: 'FRI', startsAt: '11:00', endsAt: '12:30', course: COURSES.ml, room: 'Online Sync', tone: 'accent' },
  ],
  dailyGoalPercent: 65,
  recentFiles: [
    { id: 'f-1', filename: 'Algorithms_Ch12.pdf', note: 'Shared by Dr. Mitchell', url: '/mock/files/Algorithms_Ch12.pdf' },
    { id: 'f-2', filename: 'Lab_Notes_W8.docx', note: '2 hours ago', url: '/mock/files/Lab_Notes_W8.docx' },
  ],
  campusWifiSsid: 'UNI_STUDENT_5G',
}

/** The calendar is generated per requested month so any `?month=` works. */
export function calendarFor(month: string): AcademicCalendarResponse {
  const [y, m] = month.split('-').map(Number)
  const pad = (d: number) => `${month}-${String(d).padStart(2, '0')}`
  // ponytail: same four events every month — enough to render the grid.
  // Swap for a seeded generator if a screen ever needs month-to-month variety.
  const inMonth = new Date(Date.UTC(y!, m!, 0)).getUTCDate()
  return {
    month,
    events: [
      { id: `ev-${month}-1`, date: pad(1), label: 'Labour Day', tone: 'danger', kind: 'HOLIDAY' },
      { id: `ev-${month}-2`, date: pad(4), label: 'Registration Opens', tone: 'brand', kind: 'REGISTRATION' },
      { id: `ev-${month}-3`, date: pad(13), label: 'Lab Viva', tone: 'warning', kind: 'EXAM' },
      { id: `ev-${month}-4`, date: pad(Math.min(22, inMonth)), label: "Founder's Day", tone: 'accent', kind: 'EVENT' },
    ],
  }
}

export const FACULTY_DIRECTORY: FacultyDirectoryEntry[] = [
  { id: 'fac-1', name: 'Dr. Ishtiaque Ahmed', title: 'Professor of AI & Robotics', email: 'i.ahmed@unigpt.edu', avatarUrl: null, officeRoom: 'Room 512', department: 'Computer Science & Engineering', officeHours: 'Mon 14:00–16:00' },
  { id: 'fac-2', name: 'Dr. Sarah Jenkins', title: 'Associate Dean, CSE', email: 's.jenkins@unigpt.edu', avatarUrl: null, officeRoom: 'Room 214', department: 'Computer Science & Engineering', officeHours: 'Tue 10:00–12:00' },
  { id: 'fac-3', name: 'Prof. Michael Chen', title: 'HOD, Mathematics', email: 'm.chen@unigpt.edu', avatarUrl: null, officeRoom: 'Room 108', department: 'Mathematics', officeHours: null },
  { id: 'fac-4', name: 'Dr. Elena Rodriguez', title: 'Director of Research', email: 'e.rodriguez@unigpt.edu', avatarUrl: null, officeRoom: 'Room 601', department: 'Computer Science & Engineering', officeHours: 'Wed 09:00–11:00' },
  { id: 'fac-5', name: 'Prof. David Wilson', title: 'Lead Lecturer, Business', email: 'd.wilson@unigpt.edu', avatarUrl: null, officeRoom: 'Room 320', department: 'Business Administration', officeHours: null },
  { id: 'fac-6', name: 'Dr. Amara Okafor', title: 'Sr. Lecturer, Sociology', email: 'a.okafor@unigpt.edu', avatarUrl: null, officeRoom: 'Room 415', department: 'Social Sciences', officeHours: 'Thu 13:00–15:00' },
]

export const CLASSROOMS: ClassroomsResponse = {
  rooms: [
    { id: 'rm-1', name: 'Room 402', building: 'Building A', floor: 'Floor 4', capacity: 60, currentSession: { title: 'CS-301: Advanced Data Structures', endsAt: inHours(0.75) } },
    { id: 'rm-2', name: 'Auditorium B', building: 'Building C', floor: 'Ground', capacity: 250, currentSession: { title: 'Orientation Seminar 2026', endsAt: inHours(2) } },
    { id: 'rm-3', name: 'Lab 3', building: 'Building A', floor: 'Floor 2', capacity: 40, currentSession: null },
    { id: 'rm-4', name: 'Room 210', building: 'Building B', floor: 'Floor 2', capacity: 55, currentSession: null },
  ],
}

export const SEMESTER_REGISTRATION: SemesterRegistrationResponse = {
  terms: [
    { id: 'term-2026-fall', name: 'Fall 2026', state: 'OPEN', opensAt: inDays(-10), closesAt: inDays(14) },
    { id: 'term-2027-spring', name: 'Spring 2027', state: 'UPCOMING', opensAt: inDays(90), closesAt: inDays(120) },
  ],
  advisor: { id: 'fac-1', name: 'Dr. Ishtiaque Ahmed', department: 'Department of Computer Science & Engineering' },
  selection: { courseCount: 4, totalCredits: 11, estimatedFee: '42500.00', currency: 'BDT' },
  approval: 'PENDING',
}

export const OFFERINGS: CourseOffering[] = [
  { id: 'off-1', course: COURSES.dsa, department: 'Computer Science', section: 'A', instructorName: 'Prof. Sarah Jenkins', seatsTaken: 12, seatsTotal: 60, notice: { text: 'Prerequisite: CS-201 Intro to Programming', tone: 'neutral' }, canRegister: true, blockedReason: null },
  { id: 'off-2', course: COURSES.dbms, department: 'Computer Science', section: 'A', instructorName: 'Michael Chen', seatsTaken: 5, seatsTotal: 50, notice: { text: 'Core Requirement', tone: 'brand' }, canRegister: true, blockedReason: null },
  { id: 'off-3', course: COURSES.ai, department: 'Computer Science', section: 'B', instructorName: 'Dr. Ishtiaque Ahmed', seatsTaken: 22, seatsTotal: 45, notice: { text: 'High workload elective', tone: 'warning' }, canRegister: true, blockedReason: null },
  { id: 'off-4', course: COURSES.comms, department: 'General Education', section: 'C', instructorName: 'Prof. David Wilson', seatsTaken: 31, seatsTotal: 80, notice: { text: 'General Education', tone: 'neutral' }, canRegister: true, blockedReason: null },
  { id: 'off-5', course: COURSES.advml, department: 'Computer Science', section: 'A', instructorName: 'Dr. Sarah Johnson', seatsTaken: 45, seatsTotal: 45, notice: { text: 'Section full', tone: 'danger' }, canRegister: false, blockedReason: 'No seats remaining in this section.' },
]

export const DEPARTMENTS = ['Computer Science', 'Mathematics', 'General Education', 'Business Administration']

export const DROP_ADD: DropAddResponse = {
  enrolled: [
    { offeringId: 'off-10', course: COURSES.ai, instructorName: 'Dr. Alan Turing Jr.', canDrop: true },
    { offeringId: 'off-11', course: COURSES.linalg, instructorName: 'Prof. Euler', canDrop: true },
    { offeringId: 'off-12', course: c('crs-16', 'PH-330', 'Quantum Physics', 3), instructorName: 'Dr. Schrodinger', canDrop: false },
  ],
  enrolledCredits: 10,
  fullTimeMinimumCredits: 12,
  dropDeadline: dayIn(21),
}

// ===========================================================================
// LMS
// ===========================================================================

const LMS_COURSES: LmsCourse[] = [
  { course: COURSES.advml, instructorName: 'Dr. Sarah Johnson', progress: 72, grade: 'A-' },
  { course: COURSES.cloud, instructorName: 'Prof. David Miller', progress: 58, grade: 'B+' },
  { course: COURSES.distributed, instructorName: 'Prof. James W.', progress: 64, grade: 'B+' },
  { course: COURSES.hci, instructorName: 'Elena Rodriguez', progress: 81, grade: 'A' },
]

export const LMS_OVERVIEW: LmsOverviewResponse = {
  metrics: [
    { label: 'Enrolled Courses', value: '6', tone: 'brand' },
    { label: 'Materials', value: '128', tone: 'accent' },
    { label: 'Pending Assignments', value: '8', tone: 'warning' },
    { label: 'Upcoming Quizzes', value: '12', tone: 'info' },
    { label: 'Live Classes', value: '5', tone: 'brand' },
    { label: 'Overall Grade', value: 'A-', tone: 'success' },
  ],
  courses: LMS_COURSES,
}

export const LMS_COURSES_RESPONSE: LmsCoursesResponse = {
  termId: TERM.id,
  termName: TERM.name,
  courses: LMS_COURSES,
}

export const ASSIGNMENTS: AssignmentsResponse = {
  metrics: [
    { label: 'Total Assignments', value: '08', tone: 'brand' },
    { label: 'Submitted & Received', value: '05', tone: 'success' },
    { label: 'Action Required', value: '03', tone: 'danger' },
  ],
  assignments: [
    { id: 'asg-1', title: 'Neural Network Architecture Project', course: COURSES.advml, summary: 'Design a 3-layer CNN for image recognition.', dueAt: inDays(-3), state: 'OVERDUE', grade: null, submittedAt: null },
    { id: 'asg-2', title: 'Distributed Systems Case Study', course: COURSES.distributed, summary: 'Analysis of Kafka vs RabbitMQ message brokers.', dueAt: inDays(3), state: 'DUE_SOON', grade: null, submittedAt: null },
    { id: 'asg-3', title: 'UI Design System Documentation', course: COURSES.hci, summary: 'Define typography, tokens and components.', dueAt: inDays(-9), state: 'GRADED', grade: 'A-', submittedAt: inDays(-10) },
    { id: 'asg-4', title: 'Blockchain Smart Contract Security', course: COURSES.cloud, summary: 'Identify vulnerabilities in a Solidity contract.', dueAt: inDays(-1), state: 'SUBMITTED', grade: null, submittedAt: inDays(-2) },
  ],
}

export const ASSIGNMENT_DETAIL: AssignmentDetailResponse = {
  id: 'asg-2',
  title: 'Binary Tree Operations',
  course: COURSES.dsa,
  dueAt: inDays(3),
  brief: 'Implement the following binary tree operations as discussed in the Week 6 lectures:',
  requirements: [
    'Insertion and deletion with correct re-balancing',
    'In-order, pre-order and post-order traversal',
    'Height and balance-factor calculation',
    'Unit tests covering the degenerate cases',
  ],
  integrityNote:
    "By submitting, you agree that this assignment is your own work and complies with the university's Academic Integrity Policy.",
  maxAttachments: 5,
  maxAttachmentBytes: 25 * 1024 * 1024,
  acceptedMimeTypes: ['application/pdf', 'application/zip', 'text/x-python', 'image/png'],
  submission: null,
}

export const QUIZZES: QuizzesResponse = {
  quizzes: [
    { id: 'qz-1', title: 'Introduction to SQL', course: COURSES.dbms, questionCount: 20, durationMinutes: 30, state: 'AVAILABLE', scorePercent: null, lockedReason: null },
    { id: 'qz-2', title: 'Binary Search Trees & Balancing (AVL)', course: COURSES.dsa, questionCount: 15, durationMinutes: 25, state: 'AVAILABLE', scorePercent: null, lockedReason: null },
    { id: 'qz-3', title: 'Graph Algorithms', course: COURSES.dsa, questionCount: 18, durationMinutes: 30, state: 'COMPLETED', scorePercent: 82, lockedReason: null },
    { id: 'qz-4', title: 'Red-Black Trees', course: COURSES.dsa, questionCount: 12, durationMinutes: 20, state: 'LOCKED', scorePercent: null, lockedReason: 'Complete "Binary Search Trees & Balancing" first.' },
  ],
  revisionPlan: {
    title: 'Suggested Revision Plan',
    body: 'Your average in Normalization topics is 78%, ten points below your overall average. Review Normal Forms before starting.',
  },
}

export const PRACTICE_QUIZ: PracticeQuizResponse = {
  id: 'qz-2',
  title: 'Binary Search Trees & Balancing (AVL)',
  rankNote: "You're in the top 15% of your class this week. Take 2 more quizzes to reach Silver tier.",
  questions: [
    {
      id: 'pq-1',
      prompt: 'What is the worst-case time complexity of a search in a balanced AVL tree?',
      options: [
        { id: 'pq-1-a', text: 'O(n)' },
        { id: 'pq-1-b', text: 'O(log n)' },
        { id: 'pq-1-c', text: 'O(n log n)' },
        { id: 'pq-1-d', text: 'O(1)' },
      ],
      correctOptionId: 'pq-1-b',
    },
    {
      id: 'pq-2',
      prompt: 'An AVL tree rebalances when the balance factor of a node becomes:',
      options: [
        { id: 'pq-2-a', text: '0' },
        { id: 'pq-2-b', text: '±1' },
        { id: 'pq-2-c', text: '±2 or beyond' },
        { id: 'pq-2-d', text: 'Any negative value' },
      ],
      correctOptionId: 'pq-2-c',
    },
    {
      id: 'pq-3',
      prompt: 'Which rotation fixes a left-right imbalance?',
      options: [
        { id: 'pq-3-a', text: 'Single right rotation' },
        { id: 'pq-3-b', text: 'Single left rotation' },
        { id: 'pq-3-c', text: 'Left-then-right rotation' },
        { id: 'pq-3-d', text: 'No rotation needed' },
      ],
      correctOptionId: 'pq-3-c',
    },
  ],
}

export const LIVE_CLASSES: LiveClassesResponse = {
  live: [
    { id: 'lv-1', title: 'Computer Architecture', instructorName: 'Prof. David M.', startedAt: inHours(-0.5), joinUrl: 'https://meet.unigpt.dev/mock-live-1' },
  ],
  upcoming: [
    { id: 'lv-2', title: 'Algorithms & Complexity', instructorName: 'Dr. Elena S.', startsAt: inDays(1) },
    { id: 'lv-3', title: 'Database Systems', instructorName: 'Prof. James W.', startsAt: inDays(2) },
  ],
}

export const RECORDINGS: RecordingsResponse = {
  metrics: [
    { label: 'Sessions this month', value: '12', tone: 'brand' },
    { label: 'Total watch time', value: '18h', tone: 'accent' },
  ],
  tip: 'Review "DBMS Indexing" to prepare for the upcoming mid-terms.',
  sessions: [
    { id: 'rec-1', title: 'Database Management', course: COURSES.dbms, startedAt: inDays(-4), durationSeconds: 5400, videoUrl: '/mock/video/rec-1.mp4' },
    { id: 'rec-2', title: 'Web Technologies', course: COURSES.hci, startedAt: inDays(-6), durationSeconds: 5400, videoUrl: '/mock/video/rec-2.mp4' },
    { id: 'rec-3', title: 'Artificial Intelligence', course: COURSES.ai, startedAt: inDays(-9), durationSeconds: 5400, videoUrl: '/mock/video/rec-3.mp4' },
  ],
}

export function lecturesFor(courseId: string): LecturesResponse {
  return {
    courseId,
    moduleTitle: 'Module 4: Dynamic Programming',
    summary:
      'Deep dive into optimal substructures and overlapping subproblems. Optimising recursive solutions with memoization and tabulation.',
    lectures: [
      { id: 'lec-1', title: '4.1 Optimal Substructure', durationSeconds: 1104, positionSeconds: 1104, watched: true, videoUrl: '/mock/video/lec-1.mp4' },
      { id: 'lec-2', title: '4.2 Overlapping Subproblems', durationSeconds: 1330, positionSeconds: 1330, watched: true, videoUrl: '/mock/video/lec-2.mp4' },
      { id: 'lec-3', title: '4.3 Memoization in Practice', durationSeconds: 1865, positionSeconds: 420, watched: false, videoUrl: '/mock/video/lec-3.mp4' },
      { id: 'lec-4', title: '4.4 Tabulation & Space Optimisation', durationSeconds: 1668, positionSeconds: 0, watched: false, videoUrl: '/mock/video/lec-4.mp4' },
    ],
  }
}

export function materialsFor(courseId: string): MaterialsResponse {
  return {
    courseId,
    groups: [
      { id: 'mg-1', label: 'Lecture Notes', fileCount: 24, totalBytes: 134_217_728, tone: 'brand' },
      { id: 'mg-2', label: 'PDF Textbooks', fileCount: 8, totalBytes: 471_859_200, tone: 'accent' },
      { id: 'mg-3', label: 'Slides', fileCount: 15, totalBytes: 88_080_384, tone: 'info' },
      { id: 'mg-4', label: 'Lab Manuals', fileCount: 12, totalBytes: 33_554_432, tone: 'warning' },
    ],
  }
}

export const DOWNLOADS: DownloadsResponse = {
  files: [
    { id: 'dn-1', filename: 'Algorithms_Ch12.pdf', course: COURSES.dsa, sizeBytes: 4_404_019, state: 'READY', url: '/mock/files/Algorithms_Ch12.pdf', expiresAt: inDays(7) },
    { id: 'dn-2', filename: 'Lab_Notes_W8.docx', course: COURSES.dsa, sizeBytes: 1_153_434, state: 'READY', url: '/mock/files/Lab_Notes_W8.docx', expiresAt: inDays(7) },
    { id: 'dn-3', filename: 'ML_Lecture_04.mp4', course: COURSES.advml, sizeBytes: 327_155_712, state: 'PREPARING', url: null, expiresAt: null },
    { id: 'dn-4', filename: 'Revised_Midterm_Syllabus_CS402.pdf', course: COURSES.hci, sizeBytes: 1_468_006, state: 'READY', url: '/mock/files/Revised_Midterm_Syllabus_CS402.pdf', expiresAt: inDays(3) },
  ],
}

export const FORUM_THREADS: ForumThread[] = [
  { id: 'th-1', title: 'Midterm Review Session & Query Thread', excerpt: 'Post your questions ahead of Friday.', course: COURSES.dsa, authorName: 'Prof. Sarah Jenkins', replyCount: 42, pinned: true, lastActivityAt: inHours(-2) },
  { id: 'th-2', title: 'B-Tree insertion: handling 4-node overflows', excerpt: "I'm struggling with the split logic.", course: COURSES.dsa, authorName: 'Marcus Chen', replyCount: 12, pinned: false, lastActivityAt: inHours(-6) },
  { id: 'th-3', title: 'Economic Analysis: Supply Chain Shifts', excerpt: 'Analyzing the impact of recent policy.', course: COURSES.comms, authorName: 'Priya Nair', replyCount: 8, pinned: false, lastActivityAt: inDays(-1) },
  { id: 'th-4', title: 'Neural Network Backpropagation Calculus', excerpt: 'The chain rule application for the hidden layer.', course: COURSES.advml, authorName: 'Adnan Rahman Chowdhury', replyCount: 19, pinned: false, lastActivityAt: inDays(-2) },
  { id: 'th-5', title: "Shakespeare's Hamlet: Act III Analysis", excerpt: 'Looking for secondary sources.', course: COURSES.comms, authorName: 'Lina Haque', replyCount: 5, pinned: false, lastActivityAt: inDays(-3) },
]

export function threadDetail(id: string): ForumThreadDetailResponse | null {
  const thread = FORUM_THREADS.find((t) => t.id === id)
  if (!thread) return null
  return {
    thread,
    body: 'Post your questions here and I will group the answers into a single recap before Friday.',
    replies: [
      { id: `${id}-r1`, body: 'Will the recap cover AVL deletion as well?', authorName: 'Marcus Chen', authorAvatarUrl: null, isMine: false, createdAt: inHours(-5) },
      { id: `${id}-r2`, body: 'Seconding this — deletion is where I keep losing marks.', authorName: 'Adnan Rahman Chowdhury', authorAvatarUrl: null, isMine: true, createdAt: inHours(-4) },
    ],
  }
}

export const NOTES: Note[] = [
  { id: 'nt-1', title: 'Heap Sort Complexity', body: 'Heap sort is an efficient, comparison-based sorting algorithm known for consistent O(n log n) performance in every case.', tag: 'Complexity Analysis', courseId: COURSES.dsa.id, updatedAt: inDays(-2) },
  { id: 'nt-2', title: 'AVL Rotations', body: 'Self-balancing binary search trees. Rotation operations and balance factors.', tag: 'Trees', courseId: COURSES.dsa.id, updatedAt: inDays(-5) },
  { id: 'nt-3', title: 'Graph Traversal', body: 'BFS vs DFS implementations. Applications in shortest-path and cycle detection.', tag: 'Graphs', courseId: COURSES.dsa.id, updatedAt: inDays(-8) },
]

export const LEARNING_PROGRESS: LearningProgressResponse = {
  overallPercent: 68,
  studyMinutes: 7440,
  streakDays: 9,
  courses: [
    { course: COURSES.algorithms, instructorName: 'Professor David Miller', percent: 78, tone: 'brand' },
    { course: COURSES.ml, instructorName: 'Dr. Sarah Johnson', percent: 64, tone: 'accent' },
    { course: COURSES.hci, instructorName: 'Elena Rodriguez', percent: 81, tone: 'info' },
    { course: COURSES.dbms, instructorName: 'Michael Chen', percent: 55, tone: 'warning' },
  ],
}

export const LEARNING_ANALYTICS: LearningAnalyticsResponse = {
  proficiency: [
    { label: 'Logic', percent: 88, tone: 'brand' },
    { label: 'Algorithms', percent: 76, tone: 'accent' },
    { label: 'Systems', percent: 71, tone: 'info' },
    { label: 'Discrete Math', percent: 54, tone: 'warning' },
    { label: 'Communication', percent: 82, tone: 'success' },
  ],
  insight:
    'Your peak cognitive performance is between 10:00 and 11:30. Moving Complex Algorithms sessions into that window should raise retention by an estimated 22%.',
  milestone: { label: 'Next Milestone', value: 'Exam Readiness: 88%' },
  focus: { label: 'Focus Suggestion', value: 'Review Discrete Math' },
}

export const ANNOUNCEMENTS: AnnouncementsResponse = {
  unreadCount: 2,
  announcements: [
    {
      id: 'an-1',
      title: 'CS-402 Midterm Rescheduled',
      body: 'The midterm examination for the AI module has moved from Wednesday to Thursday, 10:00 in the Main Auditorium, to accommodate the Guest Lecture series. Review the revised syllabus coverage attached below.',
      course: COURSES.hci,
      authorName: 'Dr. Ahmed Al-Farsi',
      authorRole: 'Lead AI Professor',
      attachments: [
        { id: 'att-1', filename: 'Revised_Midterm_Syllabus_CS402.pdf', sizeBytes: 1_468_006, mimeType: 'application/pdf', url: '/mock/files/Revised_Midterm_Syllabus_CS402.pdf', uploadedAt: inHours(-6) },
      ],
      publishedAt: inHours(-6),
      read: false,
      pinned: true,
    },
    { id: 'an-2', title: 'Lab 3: System Design Doc', body: 'All SDKs and library packages for Lab 4 (Agile Sprint Simulation) have been uploaded to the course module.', course: COURSES.cloud, authorName: 'Prof. David Miller', authorRole: 'Lecturer', attachments: [], publishedAt: inDays(-1), read: false, pinned: false },
    { id: 'an-3', title: 'AI Guest Lecture', body: 'Join us this Friday for a session with industry experts on the ethical frameworks of modern AI.', course: null, authorName: 'Academic Office', authorRole: 'Administration', attachments: [], publishedAt: inDays(-2), read: true, pinned: false },
    { id: 'an-4', title: 'Eigenvalues Solution Key', body: 'The detailed solution key for the Eigenvalues assignment is available for review before the quiz.', course: COURSES.linalg, authorName: 'Prof. Michael Chen', authorRole: 'HOD, Mathematics', attachments: [], publishedAt: inDays(-3), read: true, pinned: false },
  ],
}

export const GRADEBOOK: GradebookResponse = {
  completionPercent: 65,
  insight: {
    title: 'On Track for Distinction',
    body: 'Maintain your current performance in Artificial Intelligence to secure a Summa Cum Laude projection.',
  },
  rows: [
    { course: COURSES.ai, grade: 'A', points: 4.0 },
    { course: COURSES.dbms, grade: 'A-', points: 3.7 },
    { course: COURSES.networks, grade: 'B+', points: 3.3 },
    { course: COURSES.comms, grade: 'A', points: 4.0 },
  ],
}

// ===========================================================================
// Attendance
// ===========================================================================

export const ATTENDANCE_OVERVIEW: AttendanceOverviewResponse = {
  metrics: [
    { label: 'Overall Attendance', value: '92%', tone: 'info', progress: 92 },
    { label: 'Classes Attended', value: '184', tone: 'brand' },
    { label: 'Classes Missed', value: '16', tone: 'danger' },
    { label: 'Lectures', value: '94%', tone: 'success', progress: 94 },
    { label: 'Labs', value: '88%', tone: 'accent', progress: 88 },
    { label: 'Seminars', value: '90%', tone: 'warning', progress: 90 },
  ],
  today: [
    { id: 'ses-1', course: COURSES.dsa, startsAt: inHours(-4), endsAt: inHours(-2.5), mark: 'PRESENT' },
    { id: 'ses-2', course: COURSES.dbms, startsAt: inHours(2), endsAt: inHours(3.5), mark: 'PENDING' },
  ],
  streakNote: "You've maintained a 12-day streak. Consistency is highest on Tuesdays.",
}

export function dailyAttendance(date: string): DailyAttendanceResponse {
  return {
    date,
    classes: [
      { id: 'ses-1', course: COURSES.dsa, room: 'Lab 304', instructorName: 'Prof. Sarah Jenkins', startsAt: `${date}T09:00:00Z`, mark: 'PRESENT' },
      { id: 'ses-2', course: COURSES.dbms, room: 'Lecture Hall A', instructorName: 'Dr. Robert Chen', startsAt: `${date}T11:00:00Z`, mark: 'PRESENT' },
      { id: 'ses-3', course: COURSES.discrete, room: 'Seminar Room B2', instructorName: 'Prof. Liam Vance', startsAt: `${date}T13:00:00Z`, mark: 'ABSENT' },
      { id: 'ses-4', course: COURSES.hci, room: 'Main Campus Hub', instructorName: 'Dr. Emily Watson', startsAt: `${date}T15:00:00Z`, mark: 'PENDING' },
    ],
  }
}

/** No `courseId` means the server picks — see docs/api/student.md §3.4. */
export function courseAttendance(courseId: string | null): CourseAttendanceResponse {
  const course = Object.values(COURSES).find((x) => x.id === courseId) ?? COURSES.dsa
  return {
    course,
    instructorName: 'Dr. Sarah Jenkins',
    room: 'Room 402B',
    percent: 92,
    requiredPercent: 75,
    sessions: [
      { id: 'cs-1', startsAt: inDays(-2), endsAt: inDays(-2), mark: 'PRESENT' },
      { id: 'cs-2', startsAt: inDays(-4), endsAt: inDays(-4), mark: 'PRESENT' },
      { id: 'cs-3', startsAt: inDays(-9), endsAt: inDays(-9), mark: 'LATE' },
      { id: 'cs-4', startsAt: inDays(-11), endsAt: inDays(-11), mark: 'PRESENT' },
      { id: 'cs-5', startsAt: inDays(-16), endsAt: inDays(-16), mark: 'ABSENT' },
    ],
    nextSessionAt: inDays(2),
  }
}

export const ATTENDANCE_HISTORY: AttendanceHistoryResponse = {
  terms: [
    { termId: PAST_TERMS[0]!.id, termName: 'Fall 2025', percent: 92, attended: 184, total: 200 },
    { termId: PAST_TERMS[1]!.id, termName: 'Summer 2025', percent: 88, attended: 132, total: 150 },
    { termId: PAST_TERMS[2]!.id, termName: 'Spring 2025', percent: 95, attended: 190, total: 200 },
  ],
  insight: 'Your attendance in Discrete Mathematics has dropped below the 90% threshold this semester.',
  computedAt: inHours(-3),
}

export const ATTENDANCE_ANALYTICS: AttendanceAnalyticsResponse = {
  metrics: [
    { label: 'Avg. Attendance', value: '87.6%', tone: 'info' },
    { label: 'Best Subject', value: 'AI — 95%', tone: 'success' },
    { label: 'Most Missed Day', value: 'Friday', tone: 'warning' },
    { label: 'GPA Impact', value: '+0.15', tone: 'brand' },
  ],
  byWeekday: [
    { day: 'Mon', percent: 92 },
    { day: 'Tue', percent: 100 },
    { day: 'Wed', percent: 88 },
    { day: 'Thu', percent: 90 },
    { day: 'Fri', percent: 74 },
  ],
  forecast: {
    headline: 'Forecast: 91% total attendance at semester end.',
    body: 'Your trajectory in Machine Learning and Software Ethics puts attendance up +3.4% as exams approach, worth a predicted GPA boost of 0.2.',
  },
}

// ===========================================================================
// Examinations
// ===========================================================================

const EXAMS: ExamSlot[] = [
  { id: 'ex-1', course: COURSES.ai, startsAt: inDays(4), endsAt: inDays(4.08), venue: 'Auditorium West', room: 'Building 4, 3rd Floor', seatNo: 'A-42' },
  { id: 'ex-2', course: COURSES.distributed, startsAt: inDays(6), endsAt: inDays(6.08), venue: 'Lab Tower 1', room: 'Room 802', seatNo: 'B-17' },
  { id: 'ex-3', course: COURSES.hci, startsAt: inDays(8), endsAt: inDays(8.08), venue: 'Annex 3', room: 'Room 304', seatNo: 'C-05' },
]

export const EXAM_OVERVIEW: ExamOverviewResponse = {
  metrics: [
    { label: 'Total Exams', value: '12', tone: 'brand' },
    { label: 'Upcoming', value: '03', tone: 'warning' },
    { label: 'Completed', value: '09', tone: 'success' },
    { label: 'Avg Score', value: '84.6%', tone: 'info' },
    { label: 'Highest', value: '96%', tone: 'success' },
    { label: 'CGPA Impact', value: '+0.12', tone: 'accent' },
  ],
}

export const EXAM_SCHEDULE: ExamScheduleResponse = { exams: EXAMS, nextExamAt: EXAMS[0]!.startsAt }
export const UPCOMING_EXAMS: UpcomingExamsResponse = { exams: EXAMS }

export const ADMIT_CARD = {
  card: {
    candidateName: ME.fullName,
    registrationNo: 'UG-2024-0891-AD',
    programme: ME.programme!,
    department: ME.department!,
    examCenter: 'Main Campus — Block C, Room 402',
    issuedOn: dayIn(-3),
    photoUrl: null,
    qrData: 'unigpt://admit/UG-2024-0891-AD',
    pdfUrl: '/mock/files/admit-card.pdf',
  },
  blockedReason: null,
  exams: EXAMS,
  readinessPercent: 78,
}

export const EXAM_RESULTS: ExamResultsResponse = {
  termId: PAST_TERMS[0]!.id,
  termName: 'Fall 2025',
  metrics: [
    { label: 'Semester GPA', value: '3.88', tone: 'brand' },
    { label: 'Credits Attempted', value: '18', tone: 'accent' },
    { label: 'Credits Earned', value: '18', tone: 'success' },
    { label: 'Academic Standing', value: 'Excellent', tone: 'success' },
  ],
  rows: [
    { course: COURSES.dsa, category: 'Core Major', grade: 'A', points: 4.0 },
    { course: c('crs-17', 'CS-402', 'Software Engineering Principles', 3), category: 'Core Major', grade: 'A-', points: 3.7 },
    { course: c('crs-18', 'MA-301', 'Differential Equations', 3), category: 'Mathematics', grade: 'B+', points: 3.3 },
    { course: COURSES.comms, category: 'General Ed', grade: 'A', points: 4.0 },
  ],
  insight:
    "You outperformed the class average by 14.2% this semester. Strongest performance was Data Structures — consider advanced algorithms next term.",
  predictedGpa: 3.91,
}

export const GRADE_REPORT: GradeReportResponse = {
  completionPercent: 63.2,
  cgpa: 3.86,
  terms: [
    { termId: PAST_TERMS[0]!.id, termName: 'Fall 2025', gpa: 3.88, credits: 18 },
    { termId: PAST_TERMS[2]!.id, termName: 'Spring 2025', gpa: 3.9, credits: 17 },
    { termId: 'term-2024-fall', termName: 'Fall 2024', gpa: 3.82, credits: 18 },
    { termId: 'term-2024-spring', termName: 'Spring 2024', gpa: 3.84, credits: 15 },
  ],
  transcriptPdfUrl: '/mock/files/transcript.pdf',
}

export const REVALUATION: RevaluationResponse = {
  eligibleCourses: [COURSES.dsa, COURSES.discrete, COURSES.networks, c('crs-19', 'HU-101', 'Ethical Studies', 2)],
  examTypes: [
    { id: 'et-1', label: 'Semester End' },
    { id: 'et-2', label: 'Mid Term' },
    { id: 'et-3', label: 'Practical' },
  ],
  reviewTypes: [
    { id: 'rt-1', label: 'Standard Revaluation', fee: '1500.00' },
    { id: 'rt-2', label: 'Photocopy of Script', fee: '500.00' },
    { id: 'rt-3', label: 'Re-totalling', fee: '750.00' },
  ],
  requests: [
    { id: 'rv-1', course: COURSES.networks, examType: 'Semester End', reviewType: 'Standard Revaluation', status: 'PENDING', submittedAt: inDays(-6), fee: '1500.00', outcome: null },
    { id: 'rv-2', course: COURSES.discrete, examType: 'Mid Term', reviewType: 'Re-totalling', status: 'APPROVED', submittedAt: inDays(-24), fee: '750.00', outcome: 'Marks revised from 68 to 72.' },
  ],
  windowClosesAt: inDays(11),
}

export const EXAM_ATTENDANCE: ExamAttendanceResponse = {
  exam: EXAMS[0]!,
  entries: [
    { id: 'ea-1', label: 'Entry scanned', at: inDays(-14), done: true },
    { id: 'ea-2', label: 'Script collected', at: inDays(-14), done: true },
    { id: 'ea-3', label: 'Next exam check-in', at: null, done: false },
  ],
}

export const EXAM_ANALYTICS: ExamAnalyticsResponse = {
  summary: 'Across 6 active courses',
  breakdown: [
    { label: 'Theory', percent: 88, tone: 'brand' },
    { label: 'Practical', percent: 92, tone: 'success' },
    { label: 'Viva', percent: 79, tone: 'accent' },
    { label: 'Assignments', percent: 84, tone: 'info' },
    { label: 'Attendance weightage', percent: 71, tone: 'warning' },
  ],
  weakest: { title: 'CS-455: Distributed Systems', note: '3 absences recorded this term' },
  recommendations: [
    'Revise Differential Equations before the next mid-term.',
    'Book a viva practice slot — it is your lowest assessment category.',
    'Attend the CS-455 make-up lab to recover attendance weightage.',
  ],
}

// ===========================================================================
// Finance
// ===========================================================================

export const FINANCE_OVERVIEW: FinanceOverviewResponse = {
  currency: 'BDT',
  metrics: [
    { label: 'Total Payable', value: '৳48,500.00', tone: 'warning' },
    { label: 'Total Paid', value: '৳127,500.00', tone: 'success' },
    { label: 'Total Due', value: '৳48,500.00', tone: 'danger' },
    { label: 'Payment Status', value: 'Partial', tone: 'info' },
  ],
  nextDueAt: dayIn(21),
  timeline: [
    { id: 'tl-1', label: 'Admission & Initial Fees', amount: '80000.00', dueOn: dayIn(-90), paid: true },
    { id: 'tl-2', label: 'Midterm Installment', amount: '48500.00', dueOn: dayIn(21), paid: false },
    { id: 'tl-3', label: 'Final Term Balance', amount: '25500.00', dueOn: dayIn(52), paid: false },
  ],
}

export const PAYMENT_OPTIONS: PaymentOptionsResponse = {
  currency: 'BDT',
  outstanding: '48500.00',
  minimumPayable: '5000.00',
  termName: TERM.name,
  methods: [
    { id: 'pm-1', label: 'Mobile Banking', note: 'bKash, Nagad, Rocket', kind: 'MOBILE_BANKING', enabled: true },
    { id: 'pm-2', label: 'Debit / Credit Cards', note: 'Visa, Mastercard, Amex', kind: 'CARD', enabled: true },
    { id: 'pm-3', label: 'Offline Banking', note: 'Bank transfer or branch deposit', kind: 'BANK_TRANSFER', enabled: true },
  ],
  openInvoices: [
    { id: 'inv-2', title: 'Lab Access Fees', amount: '6500.00' },
    { id: 'inv-3', title: 'Hostel Accommodation', amount: '7000.00' },
  ],
}

export const FEE_STATEMENT: FeeStatementResponse = {
  currency: 'BDT',
  student: {
    fullName: ME.fullName,
    registrationNo: ME.registrationNo!,
    department: ME.department!,
    termName: TERM.name,
  },
  billing: {
    addressLines: ['Road 12, House 45, Banani'],
    city: 'Dhaka',
    postcode: '1213',
    phone: '+880 1712 345678',
    email: ME.email,
  },
  lines: [
    { id: 'ln-1', label: 'Semester Tuition', amount: '32000.00' },
    { id: 'ln-2', label: 'Lab Access Fees', amount: '6500.00' },
    { id: 'ln-3', label: 'Hostel Accommodation', amount: '7000.00' },
  ],
  paid: '32000.00',
  total: '45500.00',
  balance: '13500.00',
  pdfUrl: '/mock/files/fee-statement.pdf',
}

export const INVOICES: InvoicesResponse = {
  currency: 'BDT',
  totals: [
    { label: 'Total Payable', amount: '45500.00', tone: 'brand' },
    { label: 'Paid to Date', amount: '32000.00', tone: 'success' },
    { label: 'Outstanding', amount: '13500.00', tone: 'danger' },
  ],
  invoices: [
    { id: 'inv-1', number: 'INV-4401', title: 'Semester Tuition', note: 'Level 4, Term 1 enrollment fees', amount: '32000.00', paid: true, dueOn: dayIn(-40), pdfUrl: '/mock/files/INV-4401.pdf' },
    { id: 'inv-2', number: 'INV-4402', title: 'Lab Access Fees', note: 'Advanced Physics & AI lab access', amount: '6500.00', paid: false, dueOn: dayIn(12), pdfUrl: '/mock/files/INV-4402.pdf' },
    { id: 'inv-3', number: 'INV-4403', title: 'Hostel Accommodation', note: 'Quarterly payment for Hall C-3', amount: '7000.00', paid: false, dueOn: dayIn(12), pdfUrl: '/mock/files/INV-4403.pdf' },
  ],
}

export const INSTALLMENTS: InstallmentsResponse = {
  currency: 'BDT',
  steps: [
    { id: 'st-1', index: 1, percentOfTotal: 50, label: 'Admission & Initial Fees', amount: '80000.00', state: 'CLEARED', dueOn: dayIn(-90), clearedOn: dayIn(-92) },
    { id: 'st-2', index: 2, percentOfTotal: 30, label: 'Midterm Installment', amount: '48500.00', state: 'DUE', dueOn: dayIn(8), clearedOn: null },
    { id: 'st-3', index: 3, percentOfTotal: 20, label: 'Final Term Balance', amount: '25500.00', state: 'UPCOMING', dueOn: dayIn(39), clearedOn: null },
  ],
  tip: 'Paying Step 2 before the 22nd unlocks a 0.5% early-bird credit on the Final Term.',
}

export const PAYMENT_HISTORY: PaymentHistoryResponse = {
  currency: 'BDT',
  totalPaid: '380000.00',
  count: 14,
  nextCursor: null,
  results: [
    { id: 'pay-1', paidAt: inDays(-90), reference: 'TXN-99120', methodLabel: 'bKash', amount: '80000.00', status: 'SUCCESS', receiptUrl: '/mock/files/TXN-99120.pdf' },
    { id: 'pay-2', paidAt: inDays(-160), reference: 'TXN-98771', methodLabel: 'Visa •••• 4412', amount: '64000.00', status: 'SUCCESS', receiptUrl: '/mock/files/TXN-98771.pdf' },
    { id: 'pay-3', paidAt: inDays(-220), reference: 'TXN-98002', methodLabel: 'Bank Transfer', amount: '72000.00', status: 'SUCCESS', receiptUrl: '/mock/files/TXN-98002.pdf' },
    { id: 'pay-4', paidAt: inDays(-260), reference: 'TXN-97440', methodLabel: 'Nagad', amount: '32000.00', status: 'PENDING', receiptUrl: null },
  ],
}

// ===========================================================================
// AI
// ===========================================================================

export const AI_OVERVIEW: AiOverviewResponse = {
  metrics: [
    { label: 'Conversations', value: '48', tone: 'brand' },
    { label: 'Study Plans', value: '06', tone: 'accent' },
    { label: 'Notes', value: '23', tone: 'info' },
    { label: 'Assignments', value: '12', tone: 'warning' },
    { label: 'Quizzes', value: '19', tone: 'success' },
    { label: 'Learning Score', value: '86', tone: 'brand' },
  ],
  recentConversations: [
    { id: 'conv-1', title: 'Explaining time complexity', snippet: 'O(log n) vs O(n)', updatedAt: inHours(-2) },
    { id: 'conv-2', title: 'Review of the IS-LM model', snippet: 'Macroeconomics', updatedAt: inDays(-1) },
    { id: 'conv-3', title: 'Synthesizing benzene rings', snippet: 'Organic chemistry', updatedAt: inDays(-2) },
    { id: 'conv-4', title: "Summarize Kant's categorical imperative", snippet: 'Philosophy', updatedAt: inDays(-4) },
  ],
  quickActions: [
    { id: 'qa-1', label: 'Explain Topic', note: 'Break down complex theories simply.' },
    { id: 'qa-2', label: 'Summarize PDF', note: 'Key insights from research papers.' },
    { id: 'qa-3', label: 'Grammar Check', note: 'Academic tone and syntax review.' },
    { id: 'qa-4', label: 'Translate Text', note: 'Multi-language support for docs.' },
    { id: 'qa-5', label: 'Create Outline', note: 'Generate structures for essays.' },
    { id: 'qa-6', label: 'Code Debug', note: 'Find errors in your programming tasks.' },
    { id: 'qa-7', label: 'Citations Gen', note: 'APA, MLA, Chicago format support.' },
    { id: 'qa-8', label: 'Math Solver', note: 'Step-by-step calculus help.' },
    { id: 'qa-9', label: 'Voice Tutor', note: 'Real-time voice conversation mode.' },
  ],
  trainingStatus: 'Your assistant is synced with the current course syllabus.',
}

export function conversation(id: string): AiConversationResponse {
  return {
    id,
    title: 'Explaining time complexity',
    messages: [
      { id: `${id}-m1`, from: 'me', text: 'Can you explain the average case complexity of Quicksort and why it remains O(n log n)?', createdAt: inHours(-2) },
      { id: `${id}-m2`, from: 'ai', text: "Quicksort's performance depends on the pivot. In the average case the partition splits the array into two relatively balanced parts.", createdAt: inHours(-2) },
      { id: `${id}-m3`, from: 'ai', text: 'Even with an unbalanced 9:1 split the complexity is still O(n log n), just with a larger constant factor.', createdAt: inHours(-2) },
    ],
  }
}

export const STUDY_PLANNER_OPTIONS: StudyPlannerOptionsResponse = {
  exams: EXAMS.map((e) => ({ id: e.id, label: `${e.course.code} ${e.course.title}`, startsAt: e.startsAt })),
  targetGrades: ['A+', 'A', 'B+'],
  dailyHourChoices: [2, 3, 4],
}

export const STUDY_PLAN: StudyPlanResponse = {
  id: 'plan-1',
  nextExamAt: EXAMS[0]!.startsAt,
  days: [
    {
      date: dayIn(0),
      topic: 'Dynamic Programming Mastery',
      blocks: [
        { startsAt: '10:30', durationMinutes: 90, note: 'Implement classic DP problems. Focus on space-complexity optimisation.' },
        { startsAt: '12:00', durationMinutes: null, note: 'Join the CS-301 Study Hub voice channel to discuss common quiz mistakes.' },
        { startsAt: '14:00', durationMinutes: 30, note: 'Rapid-fire review of Big-O notation and P vs NP.' },
      ],
    },
    { date: dayIn(1), topic: 'Greedy Algorithms & Graphs', blocks: [] },
    { date: dayIn(2), topic: 'Mock Midterm Practice', blocks: [] },
    {
      date: dayIn(3),
      topic: 'Algorithms & Complexity Basics',
      blocks: [{ startsAt: '09:00', durationMinutes: 60, note: 'Recap recursive structures and memoization. Focused deep work.' }],
    },
    { date: dayIn(4), topic: 'Data Structures Recap', blocks: [] },
  ],
}

export const GENERATED_NOTE: GeneratedNoteResponse = {
  id: 'gn-1',
  title: 'Quantum Mechanics: Module 04',
  tableOfContents: ['Wave-particle duality', 'The de Broglie relation', 'Schrödinger equation', 'Wave function'],
  intro:
    'Quantum mechanics describes the physical properties of nature at the scale of atoms and subatomic particles. It underpins quantum chemistry, quantum field theory and quantum technology.',
  keyFacts: [
    { formula: 'λ = h / p', note: 'de Broglie wavelength, relating wavelength (λ) to momentum (p).' },
    { formula: 'ĤΨ = EΨ', note: "Solving this yields the wave function (Ψ), holding all information about the system's state." },
  ],
  generatedAt: inHours(-1),
}

export const QUIZ_GENERATOR_OPTIONS: QuizGeneratorOptionsResponse = {
  courses: [COURSES.dbms, COURSES.dsa, COURSES.ai],
  questionCounts: [5, 10, 20],
  types: [
    { id: 'MCQ', label: 'Multiple Choice' },
    { id: 'TRUE_FALSE', label: 'True / False' },
    { id: 'SHORT_ANSWER', label: 'Short Answer' },
  ],
  difficulties: [
    { id: 'EASY', label: 'Easy' },
    { id: 'MEDIUM', label: 'Medium' },
    { id: 'HARD', label: 'Hard' },
  ],
  focus: { courseId: COURSES.dbms.id, courseName: COURSES.dbms.title, streakNote: '3 days strong — keep it up.' },
}

export const GENERATED_QUIZ = {
  id: 'gq-1',
  insight: 'Normalization is key to database integrity. You usually struggle with 3NF — focus there.',
  questions: [
    {
      id: 'gq-1-q1',
      prompt:
        'In SQL normalization, which normal form addresses transitive dependencies by ensuring non-key attributes depend solely on the primary key?',
      options: [
        { id: 'gq-1-q1-a', text: '1NF' },
        { id: 'gq-1-q1-b', text: '2NF' },
        { id: 'gq-1-q1-c', text: '3NF' },
        { id: 'gq-1-q1-d', text: 'BCNF' },
      ],
      correctOptionId: 'gq-1-q1-c',
    },
  ],
}

export const ASSIGNMENT_HELPER: AssignmentHelperResponse = {
  outline: ['1. Introduction to Indexing Mechanisms', '2. B-Tree vs. Hash Indexing'],
  rewrittenDraft:
    'The efficacy of an index depends heavily on column selectivity. Low-selectivity columns, such as boolean flags, often perform poorly when indexed: the optimizer may still prefer a full table scan over an index seek.',
  suggestions: [
    { id: 'sg-1', text: 'This sentence is complex. Break it into two for better technical flow.', kind: 'STYLE' },
    { id: 'sg-2', text: 'Add a reference for the B-Tree time complexity (O(log n)).', kind: 'CITATION' },
  ],
}

export const ADVISOR: AiAdvisorResponse = {
  gpa: { current: 3.72, target: 3.8, percent: 92 },
  alerts: [
    {
      id: 'al-1',
      title: 'Discrete Math Alert',
      body: "Your performance in Set Theory quizzes is 15% below the class average. This component is 30% of the midterm.",
    },
  ],
  stats: [
    { label: 'Peer Benchmark', value: 'Lower 25th Percentile' },
    { label: 'Submission Rate', value: '100% (On Time)' },
  ],
  plan: [
    { id: 'pl-1', title: 'Midterm Prep: CS-301', body: "Focus on Combinatorics and Probability. Attend Prof. Zhang's office hours tomorrow at 14:00." },
    { id: 'pl-2', title: 'Python Algorithm Refactoring', body: 'Your last lab had O(n²) complexity. Review O(log n) optimisation techniques in Module 4.' },
    { id: 'pl-3', title: 'Internship Readiness', body: 'Maintain your current GPA trend to qualify for the FAANG Prep cohort in Spring.' },
  ],
  insight: "You're four graded assignments away from your 3.80 target. Focus on Discrete Math tonight to bridge the gap.",
}

export const RECOMMENDATIONS: RecommendationsResponse = {
  track: 'AI Track',
  primary: [
    { id: 'rc-1', course: COURSES.advml, matchPercent: 96, why: 'Matches your top-decile performance in Probability Theory and your interest in Neural Networks. A foundational pillar of the AI Track.' },
    { id: 'rc-2', course: c('crs-20', 'CS-620', 'Distributed Systems for ML', 3), matchPercent: 91, why: 'Recommended for scaling AI models. Your Docker and Kubernetes project work shows readiness for this curriculum.' },
  ],
  others: [
    { id: 'rc-3', course: c('crs-21', 'CS-430', 'Data Visualization', 3), matchPercent: 88, why: null },
    { id: 'rc-4', course: c('crs-22', 'CS-440', 'Python for High Performance', 2), matchPercent: 84, why: null },
  ],
  futureReady:
    'With these AI and Data courses you are on track to exceed industry standards for Machine Learning Engineer roles by 2028.',
  advice: 'Your 94% in Linear Algebra shows high aptitude for advanced Machine Learning modules.',
}

// ===========================================================================
// Certificates
// ===========================================================================

export const CERTIFICATES: Certificate[] = [
  { id: 'cert-1', serial: 'CERT-892014', title: 'Advanced Algorithms', issuer: 'Department of CSE', issuedOn: '2026-01-15', downloadUrl: '/mock/files/CERT-892014.pdf', verifyUrl: 'https://verify.unigpt.dev/CERT-892014' },
  { id: 'cert-2', serial: 'CERT-772101', title: "Dean's Honor", issuer: 'UniGPT Academic Council', issuedOn: '2025-12-10', downloadUrl: '/mock/files/CERT-772101.pdf', verifyUrl: 'https://verify.unigpt.dev/CERT-772101' },
  { id: 'cert-3', serial: 'CERT-102944', title: 'Python for Data Science', issuer: 'UniGPT Learning Hub', issuedOn: '2026-02-02', downloadUrl: '/mock/files/CERT-102944.pdf', verifyUrl: 'https://verify.unigpt.dev/CERT-102944' },
  { id: 'cert-4', serial: 'CERT-445890', title: 'UI/UX Design', issuer: 'Faculty of Arts & Design', issuedOn: '2025-12-20', downloadUrl: '/mock/files/CERT-445890.pdf', verifyUrl: 'https://verify.unigpt.dev/CERT-445890' },
]

export const CERTIFICATES_RESPONSE: CertificatesResponse = {
  certificates: CERTIFICATES,
  streak: { days: 12, note: "You're in the top 5% this month." },
  notices: [
    { id: 'nc-1', title: 'Convocation 2026 Registration', body: 'Last date to apply is the 24th.' },
    { id: 'nc-2', title: 'Holiday Notice', body: 'Campus closed on Friday for the festival.' },
  ],
}

// ===========================================================================
// Profile
// ===========================================================================

export const PROFILE: ProfileResponse = {
  ...ME,
  status: 'ACTIVE',
  bloodGroup: 'B+',
  nationalId: '1998567890123',
  dateOfBirth: '1999-10-15',
  gender: 'Male',
  phone: '+880 1712-345678',
  alternatePhone: null,
  presentAddress: 'Apt 4B, 12 Green Road, Dhanmondi, Dhaka 1205',
  permanentAddress: 'House 45, Road 2, Block A, Bashundhara R/A, Dhaka 1229',
  emergencyContact: { name: 'Kamrul Hasan', relationship: 'Father', phone: '+880 1819-223344' },
  academic: {
    faculty: 'School of Engineering & Applied Sciences',
    advisor: {
      id: 'fac-1',
      name: 'Dr. Ishtiaque Ahmed',
      title: 'Dept. Head, CS',
      email: 'i.ahmed@unigpt.edu',
      avatarUrl: null,
      officeRoom: null,
    },
    admissionDate: '2021-08-15',
    expectedGraduation: '2025-05-30',
    campus: 'Main Tech Campus',
    enrollmentStatus: 'Full-Time',
  },
  documents: [
    { id: 'doc-1', filename: 'Student ID Card', category: 'IDENTIFICATION', status: 'VERIFIED', sizeBytes: 1_258_291, mimeType: 'application/pdf', url: '/mock/files/student-id-card.pdf', uploadedAt: dayIn(-120) },
    { id: 'doc-2', filename: 'Official Transcript', category: 'ACADEMIC', status: 'VERIFIED', sizeBytes: 3_565_158, mimeType: 'application/pdf', url: '/mock/files/official-transcript.pdf', uploadedAt: dayIn(-140) },
    { id: 'doc-3', filename: 'National ID', category: 'IDENTIFICATION', status: 'VERIFIED', sizeBytes: 2_202_009, mimeType: 'image/jpeg', url: '/mock/files/national-id.jpg', uploadedAt: dayIn(-119) },
    { id: 'doc-4', filename: 'Offer Letter', category: 'ACADEMIC', status: 'VERIFIED', sizeBytes: 838_861, mimeType: 'application/pdf', url: '/mock/files/offer-letter.pdf', uploadedAt: dayIn(-155) },
    { id: 'doc-5', filename: 'Tuition Fee Receipt', category: 'FINANCIAL', status: 'VERIFIED', sizeBytes: 1_572_864, mimeType: 'application/pdf', url: '/mock/files/tuition-receipt.pdf', uploadedAt: dayIn(-95) },
    { id: 'doc-6', filename: 'Medical Certificate', category: 'MEDICAL', status: 'PENDING', sizeBytes: 4_404_019, mimeType: 'image/png', url: '/mock/files/medical-certificate.png', uploadedAt: inDays(0) },
  ],
  activity: [
    { id: 'act-1', title: 'Attendance recorded', detail: 'CS-301 Data Structures and Algorithms', category: 'ACADEMIC', at: inDays(0) },
    { id: 'act-2', title: 'Password changed successfully', detail: 'Account security updated via settings panel.', category: 'SECURITY', at: inDays(-1) },
    { id: 'act-3', title: 'Course Registration Approved', detail: 'Spring 2026 semester registration finalized by Advisor.', category: 'ACADEMIC', at: inDays(-4) },
    { id: 'act-4', title: 'Uploaded document', detail: 'Fee_Receipt_Spring2026.pdf', category: 'SYSTEM', at: inDays(-5) },
    { id: 'act-5', title: 'Logged in successfully', detail: 'IP 192.168.1.45 · Chrome on macOS', category: 'SYSTEM', at: inDays(-6) },
  ],
}

export const SECURITY: SecurityResponse = {
  twoFactorEnabled: true,
  smsRecoveryPhone: '+1 (***) ***-8842',
  authenticatorConfigured: true,
  sessions: [
    { id: 'sess-1', deviceLabel: 'MacBook Pro', location: 'San Francisco, CA · 192.168.1.1', lastSeenAt: inDays(0), isCurrent: true },
    { id: 'sess-2', deviceLabel: 'iPhone 15', location: 'San Jose, CA · 10.0.0.45', lastSeenAt: inDays(0), isCurrent: false },
  ],
}
