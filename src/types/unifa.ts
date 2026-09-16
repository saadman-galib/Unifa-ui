/**
 * Wire types for the UniFa API (`docs/API.md` on uninexus-server).
 *
 * These describe what `/api/v1` actually returns — not the screen-shaped
 * payloads the existing pages consume. Mapping lives in `src/lib/unifa.ts`.
 */

export type UnifaRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'STAFF'
export type UnifaUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type UnifaLoginUser = {
  id: string
  email: string
  role: UnifaRole
  firstName: string
  lastName: string
  studentId: string | null
  teacherId: string | null
  adminId: string | null
}

export type UnifaLoginResponse = {
  token: string
  user: UnifaLoginUser
}

export type UnifaNamed = { id: string; name: string; code?: string }

export type UnifaMe = {
  id: string
  email: string
  role: UnifaRole
  status: UnifaUserStatus
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  lastLoginAt?: string | null
  student: {
    id: string
    studentNo: string
    cgpa: string | number
    admissionYear?: number
    department: UnifaNamed
    program: UnifaNamed & { degreeType?: string; totalCredits?: number }
    digitalId?: { cardNumber: string; active: boolean } | null
  } | null
  teacher: {
    id: string
    employeeNo?: string
    designation?: string | null
    department: UnifaNamed
  } | null
  admin: { id: string; department?: UnifaNamed | null } | null
}

export type UnifaCourse = {
  id: string
  code: string
  title: string
  credits: number
  description?: string | null
  department?: UnifaNamed
}

export type UnifaSemester = {
  id: string
  name: string
  term?: string
  year?: number
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export type UnifaSchedule = {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room?: string | null
  course?: Pick<UnifaCourse, 'code' | 'title' | 'id' | 'credits'>
}

export type UnifaEnrollment = {
  id: string
  status: string
  letterGrade?: string | null
  gradePoint?: string | number | null
  enrolledAt?: string
  sectionId?: string
  studentId?: string
  examResults?: UnifaExamResult[]
  section: {
    id: string
    sectionCode: string
    capacity?: number
    room?: string | null
    course: UnifaCourse
    semester?: UnifaSemester
    schedules?: UnifaSchedule[]
    instructors?: {
      teacher?: { user?: { firstName?: string; lastName?: string } }
    }[]
  }
}

export type UnifaAnnouncement = {
  id: string
  title: string
  body: string
  audience?: string
  createdAt: string
}

export type UnifaStudentDashboard = {
  gpa: number
  attendance: number
  courses: number
  dues: number
  notices: UnifaAnnouncement[]
  enrollments: UnifaEnrollment[]
}

export type UnifaTeacherSection = {
  section: {
    id: string
    sectionCode?: string
    room?: string | null
    course: UnifaCourse
    enrollments: { id: string; studentId?: string }[]
    assignments: {
      id: string
      title: string
      dueAt?: string
      submissions: {
        id: string
        studentId?: string
        marks?: string | number | null
        submittedAt?: string
        student?: { user?: { firstName?: string; lastName?: string }; studentNo?: string }
      }[]
    }[]
    schedules: UnifaSchedule[]
  }
}

export type UnifaTeacherDashboard = {
  totalCourses: number
  totalStudents: number
  todaysClasses: number
  pendingAssignments: number
  sections: UnifaTeacherSection[]
}

export type UnifaAdminDashboard = {
  totalStudents: number
  totalTeachers: number
  departments: number
  courses: number
  revenue: number
  pendingRequests: number
}

export type UnifaTranscript = {
  studentNo: string
  cgpa: number
  enrollments: UnifaEnrollment[]
}

export type UnifaCalendarEvent = {
  id: string
  title: string
  type: string
  startDate: string
  endDate: string
  semesterId?: string
}

export type UnifaSection = {
  id: string
  sectionCode: string
  capacity: number
  room?: string | null
  course: UnifaCourse
  semester?: UnifaSemester
  instructors?: {
    isPrimary?: boolean
    teacher?: {
      id?: string
      user?: { firstName?: string; lastName?: string; email?: string | null }
      department?: UnifaNamed
    }
  }[]
  schedules?: UnifaSchedule[]
  _count?: { enrollments?: number }
}

export type UnifaDepartment = {
  id: string
  name: string
  code: string
  faculty?: UnifaNamed
  head?: { user?: { firstName?: string; lastName?: string } } | null
  programs?: UnifaNamed[]
}

export type UnifaAttendanceRecord = {
  id: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  note?: string | null
  studentId?: string
  session?: {
    id: string
    heldAt: string
    topic?: string | null
    section?: { course?: UnifaCourse; sectionCode?: string; room?: string | null }
  }
  student?: { id: string; studentNo?: string; user?: { firstName?: string; lastName?: string } }
}

export type UnifaAttendanceMy = {
  overall: number
  analytics: { course: string; percent: number; sessions: number }[]
  records: UnifaAttendanceRecord[]
}

export type UnifaAttendanceSession = {
  id: string
  heldAt: string
  topic?: string | null
  records: UnifaAttendanceRecord[]
}

export type UnifaMaterial = {
  id: string
  title: string
  type: string
  url: string
  description?: string | null
  createdAt?: string
  sectionId?: string
}

export type UnifaAssignment = {
  id: string
  title: string
  description?: string | null
  dueAt: string
  maxMarks?: number
  sectionId?: string
  _count?: { submissions?: number }
  submissions?: {
    id: string
    fileUrl?: string | null
    content?: string | null
    marks?: string | number | null
    feedback?: string | null
    submittedAt?: string
    student?: { id: string; studentNo?: string; user?: { firstName?: string; lastName?: string } }
  }[]
}

export type UnifaQuiz = {
  id: string
  title: string
  startAt?: string
  endAt?: string
  durationMinutes?: number
  questions: {
    id: string
    prompt: string
    type?: string
    options?: string[] | { id?: string; text: string }[]
    marks?: number
  }[]
}

export type UnifaExam = {
  id: string
  title: string
  type: string
  maxMarks: number | string
  course: UnifaCourse
  semester?: UnifaSemester
  schedules: { id: string; startsAt: string; room?: string | null; sectionId?: string }[]
}

export type UnifaExamResult = {
  id: string
  marks: string | number
  letterGrade?: string | null
  approved?: boolean
  exam: UnifaExam & { course?: UnifaCourse }
  enrollment?: UnifaEnrollment
}

export type UnifaInvoice = {
  id: string
  invoiceNo: string
  total: string | number
  status: string
  dueDate: string
  items: { description: string; amount: string | number }[]
  payments: UnifaPayment[]
  semester?: UnifaSemester
  student?: { user?: { firstName?: string; lastName?: string; email?: string } }
}

export type UnifaPayment = {
  id: string
  invoiceId?: string
  amount: string | number
  gateway: string
  txnId?: string | null
  status: string
  paidAt?: string | null
}

export type UnifaBook = {
  id: string
  isbn: string
  title: string
  author: string
  category?: string | null
  copies: { id: string; barcode?: string; status?: string }[]
}

export type UnifaTicket = {
  id: string
  type: string
  title?: string
  subject?: string
  body: string
  status: string
  createdAt?: string
  studentId?: string
  comments?: { id: string; body: string; createdAt?: string }[]
}

export type UnifaClub = {
  id: string
  name: string
  description?: string | null
  memberships?: { studentId: string }[]
  events?: { id: string; title?: string; startsAt?: string }[]
}

export type UnifaRoute = {
  id: string
  name: string
  fare?: string | number
  description?: string | null
  schedules: { id: string; departsAt?: string; startTime?: string; stopName?: string }[]
}

export type UnifaHostel = {
  id: string
  name: string
  rooms: {
    id: string
    roomNo?: string
    capacity?: number
    allocations?: {
      id: string
      studentId: string
      startDate?: string
      fromDate?: string
    }[]
  }[]
}

export type UnifaCertificate = {
  id: string
  type?: string
  kind?: string
  status?: string
  createdAt?: string
}

export type UnifaDigitalId = {
  id: string
  cardNumber: string
  qrPayload: string
  issuedAt: string
  expiresAt: string
  active: boolean
} | null

export type UnifaJob = {
  id: string
  title: string
  company: string
  type: string
  description: string
  deadline: string
}

export type UnifaNotification = {
  id: string
  title?: string
  body?: string
  readAt?: string | null
  createdAt: string
}

export type UnifaDirectoryUser = {
  id: string
  email: string
  role: UnifaRole
  status: UnifaUserStatus
  firstName: string
  lastName: string
  phone?: string | null
  lastLoginAt?: string | null
  createdAt?: string
  passwordHash?: string
}

export type UnifaAskResponse = {
  conversationId: string
  readOnly: boolean
  message: {
    id: string
    role: string
    content: string
    createdAt?: string
    citations?: unknown
  }
}

export type UnifaConversation = {
  id: string
  title?: string | null
  createdAt?: string
  messages: { id: string; role: string; content: string; createdAt?: string }[]
}

export type UnifaResearch = {
  projects: { id: string; title: string; summary?: string | null }[]
  publications: { id: string; title: string; venue?: string | null; year?: number; url?: string | null }[]
}

export type UnifaSetting = { key: string; value: string }

export type UnifaFinanceReport = {
  collected: number
  outstanding: number
  methods: { gateway: string; _sum: { amount: string | number | null } }[]
}

export type UnifaHealth = { ok: boolean; product?: string; service?: string }
