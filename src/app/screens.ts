import { lazy, type ComponentType } from 'react'

/**
 * Built screens, keyed by the path in routes.ts. Anything not listed here
 * falls back to <Placeholder>, which names the Figma node to build from.
 *
 * Each entry must keep its `import()` literal inline — that is what lets the
 * bundler split every screen into its own chunk.
 */
const page = (loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(async () => ({ default: (await loader())[name] as ComponentType }))

export const SCREEN_COMPONENTS: Record<string, ComponentType> = {
  // ---------------------------------------------- Phase 3 — dashboards
  '/student': page(() => import('@/features/dashboard/student-dashboard'), 'StudentDashboard'),
  '/faculty': page(() => import('@/features/dashboard/faculty-dashboard'), 'FacultyDashboard'),
  '/admin': page(() => import('@/features/dashboard/admin-dashboard'), 'AdminDashboard'),

  // ------------------------------------------------ Phase 4.1 — academic
  '/student/academic/courses': page(() => import('@/features/academic/pages/my-courses'), 'MyCourses'),
  '/student/academic/curriculum': page(() => import('@/features/academic/pages/curriculum'), 'Curriculum'),
  '/student/academic/degree-progress': page(() => import('@/features/academic/pages/degree-progress'), 'DegreeProgress'),
  '/student/academic/credits': page(() => import('@/features/academic/pages/credit-progress'), 'CreditProgress'),
  '/student/academic/routine': page(() => import('@/features/academic/pages/class-routine'), 'ClassRoutine'),
  '/student/academic/calendar': page(() => import('@/features/academic/pages/academic-calendar'), 'AcademicCalendar'),
  '/student/academic/faculty': page(() => import('@/features/academic/pages/faculty-directory'), 'FacultyDirectory'),
  '/student/academic/classrooms': page(() => import('@/features/academic/pages/classrooms'), 'Classrooms'),
  '/student/academic/registration/courses': page(() => import('@/features/academic/pages/course-registration'), 'CourseRegistration'),
  '/student/academic/registration/semester': page(() => import('@/features/academic/pages/semester-registration'), 'SemesterRegistration'),
  '/student/academic/registration/drop-add': page(() => import('@/features/academic/pages/drop-add'), 'DropAdd'),

  // ----------------------------------------------------- Phase 4.2 — LMS
  '/student/lms': page(() => import('@/features/lms/pages/lms-overview'), 'LmsOverview'),
  '/student/lms/courses': page(() => import('@/features/lms/pages/my-courses'), 'LmsMyCourses'),
  '/student/lms/courses/:id/lectures': page(() => import('@/features/lms/pages/lectures'), 'Lectures'),
  '/student/lms/courses/:id/materials': page(() => import('@/features/lms/pages/materials'), 'Materials'),
  '/student/lms/assignments': page(() => import('@/features/lms/pages/assignments'), 'Assignments'),
  '/student/lms/assignments/:id/submit': page(() => import('@/features/lms/pages/assignment-submission'), 'AssignmentSubmission'),
  '/student/lms/quizzes': page(() => import('@/features/lms/pages/quizzes'), 'Quizzes'),
  '/student/lms/quizzes/:id/practice': page(() => import('@/features/lms/pages/practice-quiz'), 'PracticeQuiz'),
  '/student/lms/live': page(() => import('@/features/lms/pages/live-classes'), 'LiveClasses'),
  '/student/lms/recordings': page(() => import('@/features/lms/pages/recordings'), 'Recordings'),
  '/student/lms/forum': page(() => import('@/features/lms/pages/forum'), 'Forum'),
  '/student/lms/notes': page(() => import('@/features/lms/pages/notes'), 'Notes'),
  '/student/lms/progress': page(() => import('@/features/lms/pages/learning-progress'), 'LearningProgress'),
  '/student/lms/analytics': page(() => import('@/features/lms/pages/learning-analytics'), 'LearningAnalytics'),
  '/student/lms/announcements': page(() => import('@/features/lms/pages/announcements'), 'Announcements'),
  '/student/lms/gradebook': page(() => import('@/features/lms/pages/gradebook'), 'Gradebook'),
  '/student/lms/downloads': page(() => import('@/features/lms/pages/downloads'), 'Downloads'),

  // ---------------------------------------------- Phase 4.3 — attendance
  '/student/attendance': page(() => import('@/features/attendance/pages/overview'), 'AttendanceOverview'),
  '/student/attendance/daily': page(() => import('@/features/attendance/pages/daily'), 'DailyAttendance'),
  '/student/attendance/by-course': page(() => import('@/features/attendance/pages/course-attendance'), 'CourseAttendance'),
  '/student/attendance/history': page(() => import('@/features/attendance/pages/history'), 'AttendanceHistory'),
  '/student/attendance/analytics': page(() => import('@/features/attendance/pages/analytics'), 'AttendanceAnalytics'),

  // --------------------------------------------- Phase 4.4 — examination
  '/student/exams': page(() => import('@/features/exams/pages/overview'), 'ExamOverview'),
  '/student/exams/schedule': page(() => import('@/features/exams/pages/schedule'), 'ExamSchedule'),
  '/student/exams/upcoming': page(() => import('@/features/exams/pages/upcoming'), 'UpcomingExams'),
  '/student/exams/admit-card': page(() => import('@/features/exams/pages/admit-card'), 'AdmitCard'),
  '/student/exams/results': page(() => import('@/features/exams/pages/results'), 'ExamResults'),
  '/student/exams/grade-report': page(() => import('@/features/exams/pages/grade-report'), 'GradeReport'),
  '/student/exams/revaluation': page(() => import('@/features/exams/pages/revaluation'), 'Revaluation'),
  '/student/exams/attendance': page(() => import('@/features/exams/pages/attendance-sheet'), 'ExamAttendanceSheet'),
  '/student/exams/analytics': page(() => import('@/features/exams/pages/analytics'), 'ExamAnalytics'),

  // ------------------------------------------------- Phase 4.5 — finance
  '/student/finance': page(() => import('@/features/finance/pages/overview'), 'FinanceOverview'),
  '/student/finance/pay': page(() => import('@/features/finance/pages/make-payment'), 'MakePayment'),
  '/student/finance/statement': page(() => import('@/features/finance/pages/fee-statement'), 'FeeStatement'),
  '/student/finance/invoices': page(() => import('@/features/finance/pages/invoices'), 'Invoices'),
  '/student/finance/installments': page(() => import('@/features/finance/pages/installments'), 'Installments'),
  '/student/finance/history': page(() => import('@/features/finance/pages/payment-history'), 'PaymentHistory'),

  // ------------------------------------------------------ Phase 4.6 — AI
  '/student/ai': page(() => import('@/features/ai/pages/overview'), 'AiOverview'),
  '/student/ai/chat': page(() => import('@/features/ai/pages/chat'), 'AiChat'),
  '/student/ai/study-planner': page(() => import('@/features/ai/pages/study-planner'), 'StudyPlanner'),
  '/student/ai/notes': page(() => import('@/features/ai/pages/note-generator'), 'NoteGenerator'),
  '/student/ai/quiz': page(() => import('@/features/ai/pages/quiz-generator'), 'QuizGenerator'),
  '/student/ai/assignment-helper': page(() => import('@/features/ai/pages/assignment-helper'), 'AssignmentHelper'),
  '/student/ai/advisor': page(() => import('@/features/ai/pages/advisor'), 'Advisor'),
  '/student/ai/recommendations': page(() => import('@/features/ai/pages/recommendations'), 'Recommendations'),

  // ------------------------------------------------- Phase 5 — faculty
  '/faculty/profile': page(() => import('@/features/faculty/pages/profile'), 'FacultyProfile'),
  '/faculty/academic': page(() => import('@/features/faculty/pages/academic'), 'FacultyAcademic'),
  '/faculty/courses': page(() => import('@/features/faculty/pages/courses-management'), 'CoursesManagement'),
  '/faculty/courses/assigned': page(() => import('@/features/faculty/pages/assigned-courses'), 'AssignedCourses'),
  '/faculty/assignments': page(() => import('@/features/faculty/pages/assignments-overview'), 'AssignmentsOverview'),
  '/faculty/assignments/:id/review': page(() => import('@/features/faculty/pages/assignment-review'), 'AssignmentReview'),
  '/faculty/gradebook': page(() => import('@/features/faculty/pages/gradebook'), 'FacultyGradebook'),
  '/faculty/attendance': page(() => import('@/features/faculty/pages/attendance-management'), 'AttendanceManagement'),
  '/faculty/exams': page(() => import('@/features/faculty/pages/exams'), 'FacultyExams'),
  '/faculty/library': page(() => import('@/features/faculty/pages/library'), 'FacultyLibrary'),
  '/faculty/research': page(() => import('@/features/faculty/pages/research-portfolio'), 'ResearchPortfolio'),
  '/faculty/research/grants': page(() => import('@/features/faculty/pages/grants'), 'Grants'),
  '/faculty/finance': page(() => import('@/features/faculty/pages/finance'), 'FacultyFinance'),

  // --------------------------------------------------- Phase 6 — admin
  '/admin/users': page(() => import('@/features/admin/pages/user-management'), 'UserManagement'),
  '/admin/users/:id': page(() => import('@/features/admin/pages/security-profile'), 'SecurityProfile'),
  '/admin/admissions': page(() => import('@/features/admin/pages/admissions'), 'Admissions'),
  '/admin/admissions/:id': page(() => import('@/features/admin/pages/application-review'), 'ApplicationReview'),
  '/admin/academic': page(() => import('@/features/admin/pages/academic-management'), 'AcademicManagement'),
  '/admin/finance': page(() => import('@/features/admin/pages/finance-control'), 'FinanceControl'),
  '/admin/exams': page(() => import('@/features/admin/pages/exam-hub'), 'ExamHub'),
  '/admin/exams/schedule': page(() => import('@/features/admin/pages/exam-scheduling'), 'ExamScheduling'),
  '/admin/exams/marks': page(() => import('@/features/admin/pages/marks-entry'), 'MarksEntry'),

  // ------------------------------------------------------- certificates
  '/student/certificates': page(() => import('@/features/certificates/page'), 'Certificates'),

  // ------------------------------------------------------ My Profile
  '/student/profile': page(() => import('@/features/profile/pages/personal-info'), 'PersonalInfo'),
  '/student/profile/academic': page(() => import('@/features/profile/pages/academic-info'), 'AcademicInfo'),
  '/student/profile/documents': page(() => import('@/features/profile/pages/documents'), 'Documents'),
  '/student/profile/activity': page(() => import('@/features/profile/pages/activity-log'), 'ActivityLog'),
  '/student/profile/security': page(() => import('@/features/profile/pages/security'), 'Security'),

  // ------------------------------- admin operations (no Figma frames yet)
  '/admin/health': page(() => import('@/features/admin/pages/system-health'), 'SystemHealth'),
  '/admin/settings': page(() => import('@/features/admin/pages/settings'), 'AdminSettings'),
  '/admin/support': page(() => import('@/features/admin/pages/support'), 'AdminSupport'),
}
