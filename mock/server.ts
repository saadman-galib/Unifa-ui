/**
 * Dev-only mock API for the portal.  `bun run mock`
 *
 * Stands in for the Django backend so the frontend can be built against the
 * real fetch path — JWTs, 401 refresh, latency, failures — instead of
 * in-process fixtures. Contracts live in docs/api/student.md and
 * docs/api/faculty.md; payloads in ./data.ts and ./faculty-data.ts, typed
 * against src/types.
 *
 * Request knobs, on any route:
 *   ?_delay=1200   override latency in ms (default MOCK_LATENCY or 250)
 *   ?_fail=500     return that status instead of the payload
 *
 * `_fail` is the whole reason this exists rather than a fixture file: an
 * optimistic mutation is only correct if you have watched it roll back.
 *
 * ponytail: in-memory state, wiped on restart. No database — the point is a
 * contract to build against, not a second implementation of the registrar.
 */

import type {
  AddCourseRequest,
  CreateNoteRequest,
  CreatePaymentRequest,
  CreateReplyRequest,
  CreateRevaluationRequest,
  DropAddRequest,
  FieldError,
  ForumReply,
  BookLoan,
  CreateServiceRequestRequest,
  Meta,
  Note,
  PagePagination,
  Pagination,
  Problem,
  PaymentIntent,
  ProfileResponse,
  QuizAttemptRequest,
  QuizAttemptResult,
  RevaluationRequestRow,
  Role,
  ServiceRequest,
  UpdateNoteRequest,
} from '../src/types/index.ts'
import * as D from './data.ts'
import * as F from './faculty-data.ts'
import * as A from './admin-data.ts'

const PORT = Number(Bun.env.MOCK_PORT ?? 8787)
const BASE_LATENCY = Number(Bun.env.MOCK_LATENCY ?? 250)
/** Below this, gzip costs more than it saves. Mirrors nginx's gzip_min_length. */
const GZIP_MIN_BYTES = 1024

// ---------------------------------------------------------------- responses

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
  'Access-Control-Max-Age': '86400',
}

/** Problem `type` URIs live under one base so they are dereferenceable. */
const PROBLEM_BASE = 'https://api.unigpt.edu/problems'

/** Stable per status. `title` must not vary with the occurrence — that is `detail`. */
const TITLES: Record<number, string> = {
  400: 'Bad request',
  401: 'Not authenticated',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Validation failed',
  429: 'Too many requests',
  500: 'Server error',
}

/**
 * Serialise, gzip when it is worth it and the client asked, tag the response.
 *
 * In production the gzip is the reverse proxy's job (docs/api/general.md §4)
 * — it is here so the dev numbers are honest about what ships.
 */
function send(
  payload: unknown,
  status: number,
  contentType: string,
  requestId: string,
  req?: Request,
): Response {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    ...CORS,
    'Content-Type': contentType,
    'X-Request-Id': requestId,
  }

  const wantsGzip = req?.headers.get('accept-encoding')?.includes('gzip')
  if (wantsGzip && body.length >= GZIP_MIN_BYTES) {
    const zipped = Bun.gzipSync(new TextEncoder().encode(body))
    headers['Content-Encoding'] = 'gzip'
    headers['Vary'] = 'Accept-Encoding'
    return new Response(zipped, { status, headers })
  }
  return new Response(body, { status, headers })
}

/** Every 2xx body: `{ data, meta }`. See docs/api/contract.md §2. */
function json(data: unknown, status = 200, req?: Request, pagination?: Pagination): Response {
  const requestId = crypto.randomUUID()
  const meta: Meta = { requestId, timestamp: new Date().toISOString() }
  if (pagination) meta.pagination = pagination
  return send({ data, meta }, status, 'application/json', requestId, req)
}

/** A paged list: rows go in `data`, paging goes in `meta`. Never both in one. */
const paged = <T>(rows: T[], pagination: Pagination, req?: Request) =>
  json(rows, 200, req, pagination)

const cursored = <T>(rows: T[], nextCursor: string | null, req?: Request) =>
  paged(rows, { nextCursor }, req)

const noContent = () => new Response(null, { status: 204, headers: CORS })

/**
 * The call sites below still write DRF's error shape — `{ detail, code }` for
 * non-field failures, `{ field: ['message'] }` for field ones — because that
 * is what a DRF `ValidationError` actually produces. This function is the
 * translation to RFC 7807, and it is deliberately the *only* place that
 * knows both shapes: on the Django side it becomes one custom
 * `EXCEPTION_HANDLER`. See docs/api/contract.md §3.5.
 */
type FailBody = { detail?: string; code?: string; [field: string]: string | string[] | undefined }

function fail(status: number, body: FailBody, req?: Request): Response {
  const requestId = crypto.randomUUID()

  const errors: FieldError[] = []
  for (const [field, value] of Object.entries(body)) {
    if (field === 'detail' || field === 'code' || !Array.isArray(value)) continue
    for (const detail of value) {
      errors.push({
        field,
        code: /may not be blank|required|at least one/i.test(detail) ? 'blank' : 'invalid',
        detail,
      })
    }
  }

  // Field-level rejections are 422 under this contract. A 400 with no field
  // errors stays a 400 — it means the request itself was malformed.
  const finalStatus = status === 400 && errors.length > 0 ? 422 : status
  const code = body.code ?? (errors.length > 0 ? 'validation_failed' : undefined)
  const detail =
    body.detail ??
    (errors.length > 0
      ? `${errors.length} field${errors.length === 1 ? ' was' : 's were'} rejected.`
      : undefined)

  const problem: Problem = {
    type: code ? `${PROBLEM_BASE}/${code.replace(/_/g, '-')}` : 'about:blank',
    title: TITLES[finalStatus] ?? `HTTP ${finalStatus}`,
    status: finalStatus,
    ...(detail ? { detail } : {}),
    ...(req ? { instance: new URL(req.url).pathname } : {}),
    ...(code ? { code } : {}),
    ...(errors.length > 0 ? { errors } : {}),
    requestId,
  }

  return send(problem, finalStatus, 'application/problem+json', requestId, req)
}

const notFound = (req: Request) => fail(404, { detail: 'Not found.' }, req)

// --------------------------------------------------------------------- auth

/**
 * Unsigned JWT with the claims `src/lib/auth.ts` reads. Mirrors
 * `src/lib/dev-auth.ts` so both paths mint the same shape. No real server
 * would accept this; nothing here is a security boundary.
 */
const b64url = (o: unknown) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const PROFILES: Record<Role, { name: string; department: string }> = {
  student: { name: D.ME.fullName, department: D.ME.department! },
  faculty: { name: 'Dr. Hasan Mahmud', department: 'Dept. of Computer Science' },
  admin: { name: 'System Admin', department: 'Institutional Admin' },
}

function mintToken(role: Role, ttlSeconds: number) {
  return [
    b64url({ alg: 'none', typ: 'JWT' }),
    b64url({
      user_id: `${role}-0891`,
      role,
      full_name: PROFILES[role].name,
      email: `${role}@unigpt.dev`,
      department: PROFILES[role].department,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
    '',
  ].join('.')
}

/** Access tokens are short on purpose: the 401-refresh path gets exercised. */
const ACCESS_TTL = Number(Bun.env.MOCK_ACCESS_TTL ?? 300)

function roleFromAuth(req: Request): Role | null {
  const raw = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!raw) return null
  try {
    const claims = JSON.parse(atob(raw.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return null
    return claims.role ?? null
  } catch {
    return null
  }
}

// ------------------------------------------------------------ mutable state

/**
 * Everything a student mutation can touch. Reset by restarting the server.
 * Faculty state lives in ./faculty-data.ts alongside the rows it mutates.
 */
const state = {
  notes: [...D.NOTES] as Note[],
  revaluations: [...D.REVALUATION.requests] as RevaluationRequestRow[],
  replies: {} as Record<string, ForumReply[]>,
  readAnnouncements: new Set<string>(),
  /** offeringIds the student has added this session. */
  cart: new Set<string>(),
  droppedOfferings: new Set<string>(),
  payments: [] as PaymentIntent[],
  /** idempotencyKey -> payment id, so a retry never charges twice. */
  paymentKeys: {} as Record<string, string>,
  lectureProgress: {} as Record<string, { positionSeconds: number; watched: boolean }>,
  profile: { ...D.PROFILE } as ProfileResponse,
  libraryLoans: [...D.LIBRARY_BORROWED_RESPONSE.activeLoans] as BookLoan[],
  libraryFines: D.LIBRARY_HISTORY_RESPONSE.outstandingFines,
  serviceRequests: [...D.SERVICE_REQUESTS] as ServiceRequest[],
  transportRequests: [...D.TRANSPORT_REQUESTS] as ServiceRequest[],
  transportPayments: D.TRANSPORT_PAYMENTS_RESPONSE.payments.map((p) => ({ ...p })),
  hostelRequests: [...D.HOSTEL_REQUESTS] as ServiceRequest[],
  hostelPayments: D.HOSTEL_LEDGER_RESPONSE.payments.map((p) => ({ ...p })),
}

let seq = 1000
const nextId = (prefix: string) => `${prefix}-${++seq}`

// ------------------------------------------------------------------- router

type Ctx = { req: Request; params: Record<string, string>; query: URLSearchParams }
type Handler = (ctx: Ctx) => Response | Promise<Response>

const routes: { method: string; segments: string[]; handler: Handler }[] = []

const route = (method: string, path: string, handler: Handler) =>
  routes.push({ method, segments: path.split('/').filter(Boolean), handler })

const GET = (p: string, h: Handler) => route('GET', p, h)
const POST = (p: string, h: Handler) => route('POST', p, h)
const PATCH = (p: string, h: Handler) => route('PATCH', p, h)
const DELETE = (p: string, h: Handler) => route('DELETE', p, h)

/** Static payload shorthand — the majority of GETs are exactly this. */
const serve = (path: string, data: unknown) => GET(path, ({ req }) => json(data, 200, req))

function match(method: string, pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  for (const r of routes) {
    if (r.method !== method || r.segments.length !== parts.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < parts.length; i++) {
      const seg = r.segments[i]!
      if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(parts[i]!)
      else if (seg !== parts[i]) { ok = false; break }
    }
    if (ok) return { handler: r.handler, params }
  }
  return null
}

const body = async <T>(req: Request): Promise<T> => (await req.json()) as T

// ===========================================================================
// Auth
// ===========================================================================

POST('/api/token/', async ({ req }) => {
  const { username } = await body<{ username?: string; password?: string }>(req)
  const role = username?.trim().toLowerCase() as Role | undefined
  if (!role || !(role in PROFILES)) {
    return fail(401, { detail: 'No active account found with the given credentials.' }, req)
  }
  return json(
    { access: mintToken(role, ACCESS_TTL), refresh: mintToken(role, 60 * 60 * 24) },
    200,
    req,
  )
})

POST('/api/token/refresh/', async ({ req }) => {
  const { refresh } = await body<{ refresh?: string }>(req)
  const role = refresh ? roleFromAuth(new Request('http://x', { headers: { authorization: `Bearer ${refresh}` } })) : null
  if (!role) return fail(401, { detail: 'Token is invalid or expired.', code: 'token_not_valid' }, req)
  return json({ access: mintToken(role, ACCESS_TTL) }, 200, req)
})

GET('/api/me/', ({ req }) => json(D.ME, 200, req))

// ===========================================================================
// Dashboard + assistant
// ===========================================================================

serve('/api/student/dashboard/', D.DASHBOARD)

GET('/api/student/ai/assist/', ({ req, query }) => {
  const context = query.get('context') ?? ''
  const found = D.ASSISTANTS[context]
  if (!found) return notFound(req)
  return json({ context, ...found }, 200, req)
})

// ===========================================================================
// Academic
// ===========================================================================

serve('/api/student/academic/courses/', D.MY_COURSES)
serve('/api/student/academic/curriculum/', D.CURRICULUM)
serve('/api/student/academic/degree-progress/', D.DEGREE_PROGRESS)
serve('/api/student/academic/credits/', D.CREDIT_PROGRESS)
serve('/api/student/academic/routine/', D.ROUTINE)
serve('/api/student/academic/classrooms/', D.CLASSROOMS)

GET('/api/student/academic/calendar/', ({ req, query }) =>
  json(D.calendarFor(query.get('month') ?? new Date().toISOString().slice(0, 7)), 200, req),
)

GET('/api/student/academic/faculty/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const dept = query.get('department')
  const rows = D.FACULTY_DIRECTORY.filter(
    (f) =>
      (!q || f.name.toLowerCase().includes(q) || (f.title ?? '').toLowerCase().includes(q)) &&
      (!dept || f.department === dept),
  )
  {
    const { results, pagination } = paginate(rows, query, '/api/student/academic/faculty/')
    return paged(results, pagination, req)
  }
})

serve('/api/student/academic/registration/semester/', D.SEMESTER_REGISTRATION)

POST('/api/student/academic/registration/semester/', async ({ req }) => {
  const { termId, offeringIds } = await body<{ termId?: string; offeringIds?: string[] }>(req)
  if (!termId || !offeringIds?.length) {
    return fail(400, { offeringIds: ['Select at least one course before submitting.'] }, req)
  }
  return json({ ...D.SEMESTER_REGISTRATION, approval: 'PENDING' }, 202, req)
})

GET('/api/student/academic/registration/courses/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const dept = query.get('department')
  const rows = D.OFFERINGS.filter(
    (o) =>
      (!q || o.course.title.toLowerCase().includes(q) || o.course.code.toLowerCase().includes(q)) &&
      (!dept || dept === 'All Departments' || o.department === dept),
  ).map((o) =>
    // Seats move as the session adds courses, so the UI can show its own effect.
    state.cart.has(o.id) ? { ...o, seatsTaken: o.seatsTaken + 1, canRegister: false, blockedReason: 'Already added.' } : o,
  )
  {
    const { results, pagination } = paginate(rows, query, '/api/student/academic/registration/courses/')
    return paged(results, pagination, req)
  }
})

POST('/api/student/academic/registration/courses/', async ({ req }) => {
  const { offeringId } = await body<AddCourseRequest>(req)
  const offering = D.OFFERINGS.find((o) => o.id === offeringId)
  if (!offering) return fail(400, { offeringId: ['Unknown offering.'] }, req)
  if (!offering.canRegister) return fail(409, { detail: offering.blockedReason ?? 'Cannot register.', code: 'seat_unavailable' }, req)
  if (state.cart.has(offeringId)) return fail(409, { detail: 'Already registered.', code: 'duplicate' }, req)
  state.cart.add(offeringId)
  return json({ ...offering, seatsTaken: offering.seatsTaken + 1, canRegister: false, blockedReason: 'Already added.' }, 201, req)
})

DELETE('/api/student/academic/registration/courses/:offeringId/', ({ params }) => {
  state.cart.delete(params.offeringId!)
  return noContent()
})

GET('/api/student/academic/registration/drop-add/', ({ req }) =>
  json(
    {
      ...D.DROP_ADD,
      enrolled: D.DROP_ADD.enrolled.filter((e) => !state.droppedOfferings.has(e.offeringId)),
      enrolledCredits: D.DROP_ADD.enrolled
        .filter((e) => !state.droppedOfferings.has(e.offeringId))
        .reduce((n, e) => n + e.course.credits, 0),
    },
    200,
    req,
  ),
)

POST('/api/student/academic/registration/drop-add/', async ({ req }) => {
  const { action, offeringId } = await body<DropAddRequest>(req)
  const row = D.DROP_ADD.enrolled.find((e) => e.offeringId === offeringId)
  if (action === 'DROP') {
    if (!row) return fail(400, { offeringId: ['Not enrolled in this offering.'] }, req)
    if (!row.canDrop) return fail(409, { detail: 'The drop deadline for this course has passed.', code: 'drop_closed' }, req)
    state.droppedOfferings.add(offeringId)
  } else {
    state.droppedOfferings.delete(offeringId)
  }
  return json(
    { id: nextId('da'), action, offeringId, status: 'PENDING', submittedAt: new Date().toISOString() },
    201,
    req,
  )
})

// ===========================================================================
// LMS
// ===========================================================================

serve('/api/student/lms/overview/', D.LMS_OVERVIEW)
serve('/api/student/lms/courses/', D.LMS_COURSES_RESPONSE)
serve('/api/student/lms/live/', D.LIVE_CLASSES)
serve('/api/student/lms/recordings/', D.RECORDINGS)
serve('/api/student/lms/downloads/', D.DOWNLOADS)
serve('/api/student/lms/progress/', D.LEARNING_PROGRESS)
serve('/api/student/lms/analytics/', D.LEARNING_ANALYTICS)
serve('/api/student/lms/gradebook/', D.GRADEBOOK)
serve('/api/student/lms/quizzes/', D.QUIZZES)

GET('/api/student/lms/courses/:courseId/lectures/', ({ req, params }) => {
  const base = D.lecturesFor(params.courseId!)
  return json(
    { ...base, lectures: base.lectures.map((l) => ({ ...l, ...state.lectureProgress[l.id] })) },
    200,
    req,
  )
})

GET('/api/student/lms/courses/:courseId/materials/', ({ req, params }) =>
  json(D.materialsFor(params.courseId!), 200, req),
)

POST('/api/student/lms/lectures/:id/progress/', async ({ req, params }) => {
  const { positionSeconds, watched } = await body<{ positionSeconds: number; watched: boolean }>(req)
  state.lectureProgress[params.id!] = { positionSeconds, watched }
  return noContent()
})

GET('/api/student/lms/assignments/', ({ req, query }) => {
  const st = query.get('state')
  return json(
    st
      ? { ...D.ASSIGNMENTS, assignments: D.ASSIGNMENTS.assignments.filter((a) => a.state === st) }
      : D.ASSIGNMENTS,
    200,
    req,
  )
})

GET('/api/student/lms/assignments/:id/', ({ req, params }) =>
  json({ ...D.ASSIGNMENT_DETAIL, id: params.id! }, 200, req),
)

POST('/api/student/lms/assignments/:id/submissions/', async ({ req, params }) => {
  const form = await req.formData()
  if (form.get('integrityAgreed') !== 'true') {
    return fail(400, { integrityAgreed: ['You must accept the academic integrity declaration.'] }, req)
  }
  // flatMap, not filter: `instanceof File` does not narrow here because Bun's
  // and node's `File` globals both resolve, and neither is the other.
  const files = form.getAll('files').flatMap((f) => (typeof f === 'string' ? [] : [f]))
  if (!files.length) return fail(400, { files: ['Attach at least one file.'] }, req)

  return json(
    {
      id: nextId('sub'),
      assignmentId: params.id!,
      state: 'SUBMITTED',
      comment: String(form.get('comment') ?? ''),
      attachments: files.map((f) => ({
        id: nextId('att'),
        filename: f.name,
        sizeBytes: f.size,
        mimeType: f.type || 'application/octet-stream',
        url: `/mock/files/${encodeURIComponent(f.name)}`,
        uploadedAt: new Date().toISOString(),
      })),
      submittedAt: new Date().toISOString(),
      grade: null,
      feedback: null,
    },
    201,
    req,
  )
})

GET('/api/student/lms/quizzes/:id/practice/', ({ req, params }) =>
  json({ ...D.PRACTICE_QUIZ, id: params.id! }, 200, req),
)

POST('/api/student/lms/quizzes/:id/attempts/', async ({ req, params }) => {
  const { answers, elapsedSeconds } = await body<QuizAttemptRequest>(req)
  const perQuestion = D.PRACTICE_QUIZ.questions.map((q) => ({
    questionId: q.id,
    correct: answers.find((a) => a.questionId === q.id)?.optionId === q.correctOptionId,
    correctOptionId: q.correctOptionId!,
  }))
  const correctCount = perQuestion.filter((p) => p.correct).length
  const result: QuizAttemptResult = {
    id: nextId('att'),
    quizId: params.id!,
    scorePercent: Math.round((correctCount / perQuestion.length) * 100),
    correctCount,
    totalCount: perQuestion.length,
    submittedAt: new Date().toISOString(),
    perQuestion,
  }
  void elapsedSeconds
  return json(result, 201, req)
})

GET('/api/student/lms/forum/threads/', ({ req, query }) => {
  const courseId = query.get('courseId')
  const rows = D.FORUM_THREADS.filter((t) => !courseId || t.course.id === courseId).map((t) => ({
    ...t,
    replyCount: t.replyCount + (state.replies[t.id]?.length ?? 0),
  }))
  return cursored(rows, null, req)
})

GET('/api/student/lms/forum/threads/:id/', ({ req, params }) => {
  const detail = D.threadDetail(params.id!)
  if (!detail) return notFound(req)
  return json({ ...detail, replies: [...detail.replies, ...(state.replies[params.id!] ?? [])] }, 200, req)
})

POST('/api/student/lms/forum/threads/', async ({ req }) => {
  const { courseId, title, body: text } = await body<{ courseId?: string; title?: string; body?: string }>(req)
  if (!title?.trim()) return fail(400, { title: ['This field may not be blank.'] }, req)
  const course = Object.values(D.COURSES).find((x) => x.id === courseId) ?? D.COURSES.dsa
  return json(
    {
      id: nextId('th'),
      title,
      excerpt: (text ?? '').slice(0, 120),
      course,
      authorName: D.ME.fullName,
      replyCount: 0,
      pinned: false,
      lastActivityAt: new Date().toISOString(),
    },
    201,
    req,
  )
})

POST('/api/student/lms/forum/threads/:id/replies/', async ({ req, params }) => {
  const { body: text } = await body<CreateReplyRequest>(req)
  if (!text?.trim()) return fail(400, { body: ['This field may not be blank.'] }, req)
  const reply: ForumReply = {
    id: nextId('rp'),
    body: text,
    authorName: D.ME.fullName,
    authorAvatarUrl: null,
    isMine: true,
    createdAt: new Date().toISOString(),
  }
  ;(state.replies[params.id!] ??= []).push(reply)
  return json(reply, 201, req)
})

GET('/api/student/lms/notes/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const tag = query.get('tag')
  const rows = state.notes.filter(
    (n) => (!q || n.title.toLowerCase().includes(q)) && (!tag || n.tag === tag),
  )
  {
    const { results, pagination } = paginate(rows, query, '/api/student/lms/notes/')
    return paged(results, pagination, req)
  }
})

POST('/api/student/lms/notes/', async ({ req }) => {
  const input = await body<CreateNoteRequest>(req)
  if (!input.title?.trim()) return fail(400, { title: ['This field may not be blank.'] }, req)
  const note: Note = {
    id: nextId('nt'),
    title: input.title,
    body: input.body ?? '',
    tag: input.tag ?? null,
    courseId: input.courseId ?? null,
    updatedAt: new Date().toISOString(),
  }
  state.notes.unshift(note)
  return json(note, 201, req)
})

PATCH('/api/student/lms/notes/:id/', async ({ req, params }) => {
  const i = state.notes.findIndex((n) => n.id === params.id)
  if (i < 0) return notFound(req)
  const patch = await body<UpdateNoteRequest>(req)
  state.notes[i] = { ...state.notes[i]!, ...patch, updatedAt: new Date().toISOString() }
  return json(state.notes[i], 200, req)
})

DELETE('/api/student/lms/notes/:id/', ({ req, params }) => {
  const i = state.notes.findIndex((n) => n.id === params.id)
  if (i < 0) return notFound(req)
  state.notes.splice(i, 1)
  return noContent()
})

GET('/api/student/lms/announcements/', ({ req }) => {
  const announcements = D.ANNOUNCEMENTS.announcements.map((a) =>
    state.readAnnouncements.has(a.id) ? { ...a, read: true } : a,
  )
  return json({ announcements, unreadCount: announcements.filter((a) => !a.read).length }, 200, req)
})

POST('/api/student/lms/announcements/:id/read/', ({ params }) => {
  state.readAnnouncements.add(params.id!)
  return noContent()
})

// ===========================================================================
// Attendance
// ===========================================================================

serve('/api/student/attendance/overview/', D.ATTENDANCE_OVERVIEW)
serve('/api/student/attendance/history/', D.ATTENDANCE_HISTORY)
serve('/api/student/attendance/analytics/', D.ATTENDANCE_ANALYTICS)

GET('/api/student/attendance/daily/', ({ req, query }) =>
  json(D.dailyAttendance(query.get('date') ?? D.dayIn(0)), 200, req),
)

GET('/api/student/attendance/by-course/', ({ req, query }) =>
  json(D.courseAttendance(query.get('courseId')), 200, req),
)

// ===========================================================================
// Examinations
// ===========================================================================

serve('/api/student/exams/overview/', D.EXAM_OVERVIEW)
serve('/api/student/exams/schedule/', D.EXAM_SCHEDULE)
serve('/api/student/exams/upcoming/', D.UPCOMING_EXAMS)
serve('/api/student/exams/admit-card/', D.ADMIT_CARD)
serve('/api/student/exams/results/', D.EXAM_RESULTS)
serve('/api/student/exams/grade-report/', D.GRADE_REPORT)
serve('/api/student/exams/attendance/', D.EXAM_ATTENDANCE)
serve('/api/student/exams/analytics/', D.EXAM_ANALYTICS)

GET('/api/student/exams/revaluation/', ({ req }) =>
  json({ ...D.REVALUATION, requests: state.revaluations }, 200, req),
)

POST('/api/student/exams/revaluation/', async ({ req }) => {
  const input = await body<CreateRevaluationRequest>(req)
  const course = D.REVALUATION.eligibleCourses.find((c) => c.id === input.courseId)
  const examType = D.REVALUATION.examTypes.find((e) => e.id === input.examTypeId)
  const reviewType = D.REVALUATION.reviewTypes.find((r) => r.id === input.reviewTypeId)
  if (!course) return fail(400, { courseId: ['Not eligible for revaluation.'] }, req)
  if (!examType) return fail(400, { examTypeId: ['Unknown exam type.'] }, req)
  if (!reviewType) return fail(400, { reviewTypeId: ['Unknown review type.'] }, req)
  if (!input.reason?.trim()) return fail(400, { reason: ['This field may not be blank.'] }, req)

  const row: RevaluationRequestRow = {
    id: nextId('rv'),
    course,
    examType: examType.label,
    reviewType: reviewType.label,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    fee: reviewType.fee,
    outcome: null,
  }
  state.revaluations = [row, ...state.revaluations]
  return json(row, 201, req)
})

// ===========================================================================
// Finance
// ===========================================================================

serve('/api/student/finance/overview/', D.FINANCE_OVERVIEW)
serve('/api/student/finance/payment-options/', D.PAYMENT_OPTIONS)
serve('/api/student/finance/statement/', D.FEE_STATEMENT)
serve('/api/student/finance/invoices/', D.INVOICES)
serve('/api/student/finance/installments/', D.INSTALLMENTS)

GET('/api/student/finance/history/', ({ req }) =>
  cursored(
    [...state.payments.filter((p) => p.status === 'SUCCESS').map(toRecord), ...D.PAYMENT_HISTORY.results],
    D.PAYMENT_HISTORY.nextCursor,
    req,
  ),
)

const toRecord = (p: PaymentIntent) => ({
  id: p.id,
  paidAt: p.createdAt,
  reference: p.reference ?? p.id,
  methodLabel: 'Mock Gateway',
  amount: p.amount,
  status: p.status,
  receiptUrl: null,
})

POST('/api/student/finance/payments/', async ({ req }) => {
  const input = await body<CreatePaymentRequest>(req)
  if (!input.idempotencyKey) {
    return fail(400, { idempotencyKey: ['Required. Generate one per payment attempt.'] }, req)
  }
  // Replaying a key returns the original intent — never a second charge.
  const existingId = state.paymentKeys[input.idempotencyKey]
  if (existingId) {
    return json(state.payments.find((p) => p.id === existingId), 200, req)
  }
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail(400, { amount: ['Enter a valid amount.'] }, req)
  }
  if (amount < Number(D.PAYMENT_OPTIONS.minimumPayable)) {
    return fail(400, { amount: [`Minimum payable is ${D.PAYMENT_OPTIONS.minimumPayable}.`] }, req)
  }
  if (amount > Number(D.PAYMENT_OPTIONS.outstanding)) {
    return fail(400, { amount: [`Cannot exceed the outstanding ${D.PAYMENT_OPTIONS.outstanding}.`] }, req)
  }

  const intent: PaymentIntent = {
    id: nextId('pay'),
    // Real gateways hand off; the UI must handle REDIRECT_REQUIRED, so mock it.
    status: 'REDIRECT_REQUIRED',
    amount: amount.toFixed(2),
    currency: 'BDT',
    redirectUrl: `http://localhost:${PORT}/mock/gateway/${seq}`,
    reference: `TXN-${seq}`,
    failureReason: null,
    createdAt: new Date().toISOString(),
  }
  state.payments.push(intent)
  state.paymentKeys[input.idempotencyKey] = intent.id
  return json(intent, 201, req)
})

GET('/api/student/finance/payments/:id/', ({ req, params }) => {
  const p = state.payments.find((x) => x.id === params.id)
  if (!p) return notFound(req)
  // Settles ~10s after creation, so the polling UI has something to observe.
  if (p.status === 'REDIRECT_REQUIRED' && Date.now() - Date.parse(p.createdAt) > 10_000) {
    p.status = 'SUCCESS'
    p.redirectUrl = null
  }
  return json(p, 200, req)
})

// ===========================================================================
// AI
// ===========================================================================

serve('/api/student/ai/overview/', D.AI_OVERVIEW)
serve('/api/student/ai/advisor/', D.ADVISOR)
serve('/api/student/ai/recommendations/', D.RECOMMENDATIONS)
serve('/api/student/ai/study-planner/options/', D.STUDY_PLANNER_OPTIONS)
serve('/api/student/ai/quiz/options/', D.QUIZ_GENERATOR_OPTIONS)

GET('/api/student/ai/conversations/', ({ req }) =>
  cursored(D.AI_OVERVIEW.recentConversations, null, req),
)

GET('/api/student/ai/conversations/:id/', ({ req, params }) =>
  json(D.conversation(params.id!), 200, req),
)

/**
 * SSE, not JSON — the chat UI must handle a stream, so the mock streams.
 * Frames match `AiStreamEvent`.
 */
POST('/api/student/ai/conversations/:id/messages/', async ({ req }) => {
  const { text } = await body<{ text?: string }>(req)
  if (!text?.trim()) return fail(400, { text: ['This field may not be blank.'] }, req)

  const reply = `Here is a walkthrough of "${text.trim().slice(0, 60)}". Quicksort partitions around a pivot; with a balanced split the recursion depth is log n, and each level costs O(n) — hence O(n log n) on average.`
  const words = reply.split(' ')
  const messageId = nextId('msg')

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (e: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`))
      for (const w of words) {
        send({ type: 'delta', text: `${w} ` })
        await Bun.sleep(30)
      }
      send({ type: 'done', messageId })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
})

POST('/api/student/ai/study-planner/', ({ req }) => json(D.STUDY_PLAN, 201, req))
POST('/api/student/ai/notes/', ({ req }) => json(D.GENERATED_NOTE, 201, req))
POST('/api/student/ai/quiz/', ({ req }) => json(D.GENERATED_QUIZ, 201, req))
POST('/api/student/ai/assignment-helper/', ({ req }) => json(D.ASSIGNMENT_HELPER, 201, req))

// ===========================================================================
// Certificates
// ===========================================================================

serve('/api/student/certificates/', D.CERTIFICATES_RESPONSE)

POST('/api/student/certificates/print-orders/', async ({ req }) => {
  const { certificateIds, copies } = await body<{ certificateIds?: string[]; copies?: number }>(req)
  if (!certificateIds?.length) return fail(400, { certificateIds: ['Select at least one certificate.'] }, req)
  return json(
    {
      id: nextId('ord'),
      status: 'PENDING',
      fee: (500 * (copies ?? 1) * certificateIds.length).toFixed(2),
      createdAt: new Date().toISOString(),
    },
    201,
    req,
  )
})

// ===========================================================================
// Profile
// ===========================================================================

GET('/api/student/profile/', ({ req }) => json(state.profile, 200, req))

PATCH('/api/student/profile/', async ({ req }) => {
  const patch = await body<Record<string, unknown>>(req)
  // Only the self-editable subset; identity and academic fields are the registrar's.
  const allowed = ['phone', 'alternatePhone', 'presentAddress', 'permanentAddress', 'emergencyContact']
  const rejected = Object.keys(patch).filter((k) => !allowed.includes(k))
  if (rejected.length) {
    return fail(403, { detail: `Not editable here: ${rejected.join(', ')}.`, code: 'read_only_field' }, req)
  }
  state.profile = { ...state.profile, ...patch }
  return json(state.profile, 200, req)
})

POST('/api/student/profile/photo/', async ({ req }) => {
  const form = await req.formData()
  const file = form.get('photo')
  if (!file || typeof file === 'string') return fail(400, { photo: ['Attach a photo.'] }, req)
  state.profile = { ...state.profile, avatarUrl: `/mock/files/${encodeURIComponent(file.name)}` }
  return json({ avatarUrl: state.profile.avatarUrl }, 200, req)
})

POST('/api/student/profile/documents/', async ({ req }) => {
  const form = await req.formData()
  const file = form.get('file')
  const category = form.get('category')
  if (!file || typeof file === 'string') return fail(400, { file: ['Attach a file.'] }, req)
  const doc = {
    id: nextId('doc'),
    filename: file.name,
    sizeBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
    url: `/mock/files/${encodeURIComponent(file.name)}`,
    uploadedAt: new Date().toISOString(),
    category: (typeof category === 'string' ? category : 'IDENTIFICATION') as ProfileResponse['documents'][number]['category'],
    status: 'PENDING' as const,
  }
  state.profile = { ...state.profile, documents: [doc, ...state.profile.documents] }
  return json(doc, 201, req)
})

GET('/api/student/profile/security/', ({ req }) => json(D.SECURITY, 200, req))

POST('/api/student/profile/security/password/', async ({ req }) => {
  const { currentPassword, newPassword } = await body<{ currentPassword?: string; newPassword?: string }>(req)
  if (!currentPassword) return fail(400, { currentPassword: ['This field may not be blank.'] }, req)
  if (!newPassword || newPassword.length < 8) {
    return fail(400, { newPassword: ['Must be at least 8 characters long.'] }, req)
  }
  return json({ summary: 'Password changed successfully.', at: new Date().toISOString() }, 200, req)
})

POST('/api/student/profile/security/sessions/revoke-others/', ({ req }) => {
  return json({ summary: 'Signed out of all other sessions.', at: new Date().toISOString() }, 200, req)
})

// ===========================================================================
// Library
// ===========================================================================

GET('/api/student/library/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const category = query.get('category')
  const catalog = D.LIBRARY_CATALOG_RESPONSE.catalog.filter(
    (b) =>
      (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)) &&
      (!category || category === 'ALL' || b.category === category),
  )
  return json(
    { stats: { ...D.LIBRARY_CATALOG_RESPONSE.stats, myBorrowedCount: state.libraryLoans.length }, catalog },
    200,
    req,
  )
})

GET('/api/student/library/borrowed/', ({ req }) => json({ activeLoans: state.libraryLoans }, 200, req))

POST('/api/student/library/borrowed/:loanId/renew/', ({ req, params }) => {
  const loan = state.libraryLoans.find((l) => l.id === params.loanId)
  if (!loan) return notFound(req)
  loan.dueAt = D.dayIn(7)
  return json({ loan, summary: `Renewed — now due ${loan.dueAt}.` }, 200, req)
})

GET('/api/student/library/history/', ({ req }) =>
  json({ outstandingFines: state.libraryFines, loans: D.LIBRARY_HISTORY_RESPONSE.loans }, 200, req),
)

POST('/api/student/library/fines/pay/', ({ req }) => {
  const paid = state.libraryFines
  state.libraryFines = '0.00'
  return json({ summary: `Paid ${paid} in outstanding fines.`, at: new Date().toISOString() }, 200, req)
})

POST('/api/student/library/acquisition-requests/', async ({ req }) => {
  const input = await body<{ title?: string; author?: string; category?: string; reason?: string }>(req)
  if (!input.title?.trim()) return fail(400, { title: ['This field may not be blank.'] }, req)
  if (!input.reason?.trim()) return fail(400, { reason: ['This field may not be blank.'] }, req)
  return json({ summary: 'Acquisition request submitted for review.', at: new Date().toISOString() }, 201, req)
})

POST('/api/student/library/feedback/', async ({ req }) => {
  const input = await body<{ subject?: string; description?: string }>(req)
  if (!input.subject?.trim()) return fail(400, { subject: ['This field may not be blank.'] }, req)
  return json({ summary: 'Feedback ticket submitted.', at: new Date().toISOString() }, 201, req)
})

// ===========================================================================
// Student Services
// ===========================================================================

GET('/api/student/services/', ({ req }) =>
  json(
    {
      counts: {
        total: state.serviceRequests.length,
        inProgress: state.serviceRequests.filter((r) => r.status === 'IN_PROGRESS').length,
        completed: state.serviceRequests.filter((r) => r.status === 'COMPLETED').length,
        closed: state.serviceRequests.filter((r) => r.status === 'CLOSED').length,
      },
      recent: state.serviceRequests.slice(0, 5),
    },
    200,
    req,
  ),
)

GET('/api/student/services/requests/', ({ req, query }) => {
  const status = query.get('status')
  const rows = state.serviceRequests.filter((r) => !status || status === 'ALL' || r.status === status)
  return json({ requests: rows }, 200, req)
})

GET('/api/student/services/requests/:id/', ({ req, params }) => {
  const found = state.serviceRequests.find((r) => r.id === params.id || r.reference === params.id)
  return found ? json(found, 200, req) : notFound(req)
})

POST('/api/student/services/requests/', async ({ req }) => {
  const input = await body<CreateServiceRequestRequest>(req)
  if (!input.subject?.trim()) return fail(400, { subject: ['This field may not be blank.'] }, req)
  if (!input.description?.trim()) return fail(400, { description: ['This field may not be blank.'] }, req)
  const created: ServiceRequest = {
    id: nextId('sr'),
    reference: `SR-2026-${String(state.serviceRequests.length + 1).padStart(4, '0')}`,
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status: 'SUBMITTED',
    assignedDept: null,
    agent: null,
    submittedAt: new Date().toISOString(),
  }
  state.serviceRequests = [created, ...state.serviceRequests]
  return json(created, 201, req)
})

// ===========================================================================
// Transport
// ===========================================================================

serve('/api/student/transport/', D.TRANSPORT_RESPONSE)

GET('/api/student/transport/payments/', ({ req }) => json({ payments: state.transportPayments }, 200, req))

POST('/api/student/transport/payments/pay/', ({ req }) => {
  const due = state.transportPayments.find((p) => p.status !== 'PAID')
  if (!due) return fail(409, { detail: 'No outstanding transport payment.' }, req)
  due.status = 'PAID'
  due.paidAt = new Date().toISOString()
  return json({ summary: `Paid ${due.month} transport fee.`, at: due.paidAt }, 200, req)
})

GET('/api/student/transport/requests/', ({ req }) => json({ requests: state.transportRequests }, 200, req))

POST('/api/student/transport/requests/', async ({ req }) => {
  const input = await body<CreateServiceRequestRequest>(req)
  if (!input.subject?.trim()) return fail(400, { subject: ['This field may not be blank.'] }, req)
  const created: ServiceRequest = {
    id: nextId('tr'),
    reference: `SR-2026-${String(state.transportRequests.length + 100).padStart(4, '0')}`,
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status: 'SUBMITTED',
    assignedDept: 'Transport Office',
    agent: null,
    submittedAt: new Date().toISOString(),
  }
  state.transportRequests = [created, ...state.transportRequests]
  return json(created, 201, req)
})

// ===========================================================================
// Hostel
// ===========================================================================

serve('/api/student/hostel/', D.HOSTEL_RESPONSE)

GET('/api/student/hostel/ledger/', ({ req }) => json({ payments: state.hostelPayments }, 200, req))

POST('/api/student/hostel/ledger/pay/', async ({ req }) => {
  const { paymentId } = await body<{ paymentId?: string }>(req)
  const due = state.hostelPayments.find((p) => p.id === paymentId && p.status !== 'PAID')
  if (!due) return fail(409, { detail: 'That payment is not outstanding.' }, req)
  due.status = 'PAID'
  due.paidAt = new Date().toISOString()
  return json({ summary: `Paid ${due.kind === 'MESS_FEE' ? 'mess fee' : 'hostel fee'}.`, at: due.paidAt }, 200, req)
})

GET('/api/student/hostel/requests/', ({ req }) => json({ requests: state.hostelRequests }, 200, req))

POST('/api/student/hostel/requests/', async ({ req }) => {
  const input = await body<CreateServiceRequestRequest>(req)
  if (!input.subject?.trim()) return fail(400, { subject: ['This field may not be blank.'] }, req)
  const created: ServiceRequest = {
    id: nextId('hr'),
    reference: `SR-2026-${String(state.hostelRequests.length + 200).padStart(4, '0')}`,
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status: 'SUBMITTED',
    assignedDept: 'Hostel Office',
    agent: null,
    submittedAt: new Date().toISOString(),
  }
  state.hostelRequests = [created, ...state.hostelRequests]
  return json(created, 201, req)
})

// ===========================================================================
// Faculty
// ===========================================================================

serve('/api/faculty/dashboard/', F.DASHBOARD)
serve('/api/faculty/academic/', F.ACADEMIC)
serve('/api/faculty/sections/', F.ASSIGNED_SECTIONS)
serve('/api/faculty/exams/', F.EXAMS)
serve('/api/faculty/research/', F.RESEARCH)
serve('/api/faculty/research/grants/', F.GRANTS)
serve('/api/faculty/finance/', F.FINANCE)

GET('/api/faculty/sections/:id/', ({ req, params }) => {
  const detail = F.sectionDetail(params.id!)
  return detail ? json(detail, 200, req) : notFound(req)
})

POST('/api/faculty/sections/:id/materials/', async ({ req, params }) => {
  const form = await req.formData()
  const files = form.getAll('files').flatMap((f) => (typeof f === 'string' ? [] : [f]))
  if (!files.length) return fail(400, { files: ['Attach at least one file.'] }, req)
  void params
  return json(
    files.map((f) => ({
      id: nextId('mat'),
      filename: f.name,
      sizeBytes: f.size,
      mimeType: f.type || 'application/octet-stream',
      url: `/mock/files/${encodeURIComponent(f.name)}`,
      uploadedAt: new Date().toISOString(),
    })),
    201,
    req,
  )
})

// -------------------------------------------------------------- assignments

serve('/api/faculty/assignments/', F.ASSIGNMENTS_RESPONSE)

POST('/api/faculty/assignments/', async ({ req }) => {
  const input = await body<{ sectionId?: string; title?: string; totalPoints?: number; dueAt?: string; publish?: boolean }>(req)
  if (!input.title?.trim()) return fail(400, { title: ['This field may not be blank.'] }, req)
  const section = F.SECTIONS.find((s) => s.id === input.sectionId)
  if (!section) return fail(400, { sectionId: ['Unknown section.'] }, req)
  if (!input.dueAt || Date.parse(input.dueAt) <= Date.now()) {
    return fail(400, { dueAt: ['The due date must be in the future.'] }, req)
  }
  return json(
    {
      id: nextId('fasg'),
      title: input.title,
      section,
      dueAt: input.dueAt,
      totalPoints: input.totalPoints ?? 100,
      submittedCount: 0,
      gradedCount: 0,
      enrolledCount: section.enrolledCount,
      published: input.publish ?? false,
    },
    201,
    req,
  )
})

GET('/api/faculty/assignments/:id/submissions/', ({ req, params }) => {
  const found = F.submissionsFor(params.id!)
  return found ? json(found, 200, req) : notFound(req)
})

GET('/api/faculty/submissions/:id/', ({ req, params }) =>
  json(F.submissionDetail(params.id!), 200, req),
)

route('PUT', '/api/faculty/submissions/:id/grade/', async ({ req, params }) => {
  const input = await body<{ scores?: { criterionId: string; points: number }[]; feedback?: string; release?: boolean }>(req)
  const scores = input.scores ?? []

  // Every criterion, every time — a partial rubric would keep stale marks.
  const missing = F.RUBRIC.filter((r) => !scores.some((s) => s.criterionId === r.id))
  if (missing.length) {
    return fail(400, { scores: [`Missing marks for: ${missing.map((m) => m.label).join(', ')}.`] }, req)
  }
  for (const s of scores) {
    const criterion = F.RUBRIC.find((r) => r.id === s.criterionId)
    if (!criterion) return fail(400, { scores: [`Unknown criterion ${s.criterionId}.`] }, req)
    if (s.points < 0 || s.points > criterion.maxPoints) {
      return fail(400, { scores: [`${criterion.label} must be between 0 and ${criterion.maxPoints}.`] }, req)
    }
  }

  const totalScore = scores.reduce((n, s) => n + s.points, 0)
  return json(
    {
      id: params.id!,
      totalScore,
      grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'A-' : totalScore >= 70 ? 'B+' : 'B',
      released: input.release ?? false,
      gradedAt: new Date().toISOString(),
    },
    200,
    req,
  )
})

// ---------------------------------------------------------------- gradebook

GET('/api/faculty/gradebook/', ({ req, query }) =>
  json(F.gradebook(query.get('sectionId') ?? F.SECTIONS[0]!.id), 200, req),
)

PATCH('/api/faculty/gradebook/', async ({ req, query }) => {
  const { entries } = await body<{ entries?: { studentId: string; columnId: string; points: number | null }[] }>(req)
  if (!entries?.length) return fail(400, { entries: ['Nothing to save.'] }, req)

  // Partial success: valid cells land, invalid ones come back with a reason.
  // Rejecting the whole batch would lose thirty good edits over one typo.
  const rejected: { studentId: string; columnId: string; reason: string }[] = []
  let saved = 0

  for (const e of entries) {
    const column = F.COLUMNS.find((c) => c.id === e.columnId)
    if (!column) {
      rejected.push({ ...e, reason: 'Unknown assessment.' })
      continue
    }
    if (!column.editable) {
      rejected.push({ ...e, reason: `${column.label} is locked — results are published.` })
      continue
    }
    if (e.points !== null && (e.points < 0 || e.points > column.maxPoints)) {
      rejected.push({ ...e, reason: `Must be between 0 and ${column.maxPoints}.` })
      continue
    }
    ;(F.GRADES[e.studentId] ??= {})[e.columnId] = e.points
    saved++
  }

  void query
  return json({ saved, rejected }, 200, req)
})

// --------------------------------------------------------------- attendance

GET('/api/faculty/attendance/', ({ req, query }) =>
  json(
    F.attendanceSheet(query.get('sectionId') ?? F.SECTIONS[0]!.id, query.get('date') ?? D.dayIn(0)),
    200,
    req,
  ),
)

route('PUT', '/api/faculty/attendance/:sessionId/', async ({ req, params }) => {
  const { marks } = await body<{ marks?: { studentId: string; mark: string }[] }>(req)
  if (!marks?.length) return fail(400, { marks: ['Submit the whole roster.'] }, req)

  // The whole roster, every time: a partial submit cannot distinguish
  // "unmarked" from "absent", and that difference is exam eligibility.
  const missing = F.ROSTER.filter((s) => !marks.some((m) => m.studentId === s.id))
  if (missing.length) {
    return fail(400, { marks: [`Missing marks for ${missing.length} student(s).`] }, req)
  }

  const sessionId = params.sessionId!
  F.ATTENDANCE[sessionId] = Object.fromEntries(marks.map((m) => [m.studentId, m.mark]))
  return json(
    {
      sessionId,
      presentCount: marks.filter((m) => m.mark === 'PRESENT' || m.mark === 'LATE').length,
      totalCount: marks.length,
      submittedAt: new Date().toISOString(),
    },
    200,
    req,
  )
})

// ------------------------------------------------------- profile · library

GET('/api/faculty/profile/', ({ req }) => json(F.PROFILE, 200, req))

PATCH('/api/faculty/profile/', async ({ req }) => {
  const patch = await body<Record<string, unknown>>(req)
  // Only self-editable fields; anything else is the registrar's to change.
  const allowed = ['phone', 'officeRoom', 'specializations']
  const rejected = Object.keys(patch).filter((k) => !allowed.includes(k))
  if (rejected.length) {
    return fail(403, { detail: `Not editable here: ${rejected.join(', ')}.`, code: 'read_only_field' }, req)
  }
  return json({ ...F.PROFILE, ...patch }, 200, req)
})

GET('/api/faculty/library/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const kind = query.get('kind')
  const rows = F.LIBRARY.filter(
    (i) =>
      (!q || i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q)) &&
      (!kind || i.kind === kind),
  )
  {
    const { results, pagination } = paginate(rows, query, '/api/faculty/library/')
    return paged(results, pagination, req)
  }
})

POST('/api/faculty/library/:id/reserve/', ({ req, params }) => {
  const item = F.LIBRARY.find((i) => i.id === params.id)
  if (!item) return notFound(req)
  return json(
    {
      id: nextId('res'),
      itemId: item.id,
      status: item.available ? 'RESERVED' : 'QUEUED',
      queuePosition: item.available ? null : 2,
      expiresAt: item.available ? new Date(Date.now() + 3 * 86_400_000).toISOString() : null,
    },
    201,
    req,
  )
})

// ===========================================================================
// Admin
// ===========================================================================

serve('/api/admin/dashboard/', A.DASHBOARD)
serve('/api/admin/academic/', A.ACADEMIC)
serve('/api/admin/exams/', A.EXAM_HUB)
serve('/api/admin/finance/', A.FINANCE)
serve('/api/admin/health/', A.HEALTH)

// ------------------------------------------------------------------- users

GET('/api/admin/users/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const role = query.get('role')
  const status = query.get('status')

  const rows = A.USERS.map((u) => ({ ...u, ...A.USER_OVERRIDES[u.id] })).filter(
    (u) =>
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.reference.toLowerCase().includes(q)) &&
      (!role || role === 'ALL' || u.role === role) &&
      (!status || status === 'ALL' || u.status === status),
  )

  const { results, pagination } = paginate(rows, query, '/api/admin/users/')
  return json({ metrics: A.USER_METRICS, results }, 200, req, pagination)
})

POST('/api/admin/users/', async ({ req }) => {
  const input = await body<{ fullName?: string; email?: string; role?: string; departmentId?: string | null }>(req)
  if (!input.fullName?.trim()) return fail(400, { fullName: ['This field may not be blank.'] }, req)
  if (!input.email?.includes('@')) return fail(400, { email: ['Enter a valid email address.'] }, req)
  if (A.USERS.some((u) => u.email === input.email)) {
    return fail(409, { detail: 'A user with that email already exists.', code: 'duplicate_email' }, req)
  }
  return json(
    {
      id: nextId('usr'),
      reference: `U-${2000 + seq}`,
      fullName: input.fullName,
      email: input.email,
      role: input.role ?? 'student',
      department: A.DEPARTMENTS.find((d) => d.id === input.departmentId) ?? null,
      status: 'INVITED',
      lastActiveAt: null,
    },
    201,
    req,
  )
})

GET('/api/admin/users/:id/security/', ({ req, params }) => {
  const profile = A.securityProfile(params.id!)
  return profile ? json(profile, 200, req) : notFound(req)
})

PATCH('/api/admin/users/:id/status/', async ({ req, params }) => {
  const { status, reason } = await body<{ status?: string; reason?: string }>(req)
  const user = A.USERS.find((u) => u.id === params.id)
  if (!user) return notFound(req)

  // A deactivation with no recorded reason is indistinguishable from a
  // mistake three months later, so the server insists on one.
  if (status !== 'ACTIVE' && !reason?.trim()) {
    return fail(400, { reason: ['A reason is required when restricting an account.'] }, req)
  }
  A.USER_OVERRIDES[user.id] = { status: status as never }

  return json(
    {
      user: { ...user, status },
      audit: A.audit('USER_STATUS', `${user.fullName} set to ${status}. ${reason ?? ''}`.trim()),
    },
    200,
    req,
  )
})

DELETE('/api/admin/users/:id/sessions/:sessionId/', ({ req, params }) => {
  // The current session cannot be revoked from here — locking yourself out of
  // the console mid-incident is not a recoverable state.
  if (params.sessionId!.endsWith('-s1')) {
    return fail(409, { detail: 'You cannot revoke the session you are using.', code: 'current_session' }, req)
  }
  A.REVOKED_SESSIONS.add(params.sessionId!)
  return json(A.audit('SESSION_REVOKE', `Revoked session ${params.sessionId}`), 200, req)
})

POST('/api/admin/users/:id/password-reset/', ({ req, params }) => {
  const user = A.USERS.find((u) => u.id === params.id)
  if (!user) return notFound(req)
  return json(A.audit('PASSWORD_RESET', `Reset link sent to ${user.email}`), 200, req)
})

// -------------------------------------------------------------- admissions

GET('/api/admin/admissions/', ({ req, query }) => {
  const q = (query.get('q') ?? '').toLowerCase()
  const status = query.get('status')

  const rows = A.APPLICATIONS.map((a) => ({
    ...a,
    status: A.APPLICATION_DECISIONS[a.id] ?? a.status,
  })).filter(
    (a) =>
      (!q || a.applicantName.toLowerCase().includes(q) || a.reference.toLowerCase().includes(q)) &&
      (!status || status === 'ALL' || a.status === status),
  )

  const { results, pagination } = paginate(rows, query, '/api/admin/admissions/')
  return json({ metrics: A.ADMISSION_METRICS, programmes: A.PROGRAMMES, results }, 200, req, pagination)
})

GET('/api/admin/admissions/:id/', ({ req, params }) => {
  const detail = A.applicationDetail(params.id!)
  return detail ? json(detail, 200, req) : notFound(req)
})

POST('/api/admin/admissions/:id/decision/', async ({ req, params }) => {
  const input = await body<{ status?: string; templateId?: string | null; note?: string }>(req)
  const row = A.APPLICATIONS.find((a) => a.id === params.id)
  if (!row) return notFound(req)

  const current = A.APPLICATION_DECISIONS[row.id] ?? row.status
  if (current === 'APPROVED' || current === 'REJECTED') {
    return fail(409, { detail: `This application was already ${current.toLowerCase()}.`, code: 'already_decided' }, req)
  }
  // An approval sends an offer letter, so the template is not optional.
  if (input.status === 'APPROVED' && !input.templateId) {
    return fail(400, { templateId: ['Choose an offer letter template.'] }, req)
  }
  if (input.status !== 'APPROVED' && input.templateId) {
    return fail(400, { templateId: ['A template only applies to an approval.'] }, req)
  }

  A.APPLICATION_DECISIONS[row.id] = input.status as never
  return json(
    {
      application: { ...row, status: input.status, reviewerName: 'System Admin' },
      audit: A.audit('ADMISSION_DECISION', `${row.reference} ${String(input.status).toLowerCase()}`),
      notificationQueued: true,
    },
    200,
    req,
  )
})

// ----------------------------------------------------------- exam schedule

GET('/api/admin/exams/schedule/', ({ req }) => json(A.examSchedule(), 200, req))

PATCH('/api/admin/exams/schedule/:slotId/', async ({ req, params }) => {
  const { hallId, proctorId } = await body<{ hallId?: string | null; proctorId?: string | null }>(req)
  const slot = A.SLOTS.find((s) => s.id === params.slotId)
  if (!slot) return notFound(req)

  const hall = A.HALLS.find((h) => h.id === hallId)?.name ?? null
  const proctor = A.PROCTORS.find((p) => p.id === proctorId)?.name ?? null

  // A hall already taken at the same instant is a clash, not a preference.
  const clash = A.SLOTS.find(
    (s) =>
      s.id !== slot.id &&
      s.startsAt === slot.startsAt &&
      hall !== null &&
      (A.SLOT_OVERRIDES[s.id]?.hall ?? s.hall) === hall,
  )
  if (clash) {
    return fail(
      409,
      { detail: `${hall} is already assigned to ${clash.course.code} at that time.`, code: 'hall_clash' },
      req,
    )
  }

  A.SLOT_OVERRIDES[slot.id] = { hall, proctorName: proctor }
  return json(A.examSchedule(), 200, req)
})

// ------------------------------------------------------------- marks entry

GET('/api/admin/exams/marks/', ({ req }) => json(A.marksEntry(), 200, req))

PATCH('/api/admin/exams/marks/', async ({ req }) => {
  const { entries } = await body<{ entries?: { studentId: string; marks: number | null }[] }>(req)
  if (!entries?.length) return fail(400, { entries: ['Nothing to save.'] }, req)
  if (A.MARKS_STATUS === 'PUBLISHED') {
    return fail(409, { detail: 'Results are published; the sheet is locked.', code: 'locked' }, req)
  }

  const max = 30
  const rejected: { studentId: string; reason: string }[] = []
  let saved = 0
  for (const e of entries) {
    if (!(e.studentId in A.MARKS)) {
      rejected.push({ studentId: e.studentId, reason: 'Not enrolled in this section.' })
      continue
    }
    if (e.marks !== null && (e.marks < 0 || e.marks > max)) {
      rejected.push({ studentId: e.studentId, reason: `Must be between 0 and ${max}.` })
      continue
    }
    A.MARKS[e.studentId] = e.marks
    saved++
  }
  return json({ saved, rejected }, 200, req)
})

POST('/api/admin/exams/marks/publish/', async ({ req }) => {
  const { confirmation } = await body<{ confirmation?: string }>(req)
  const sheet = A.marksEntry()

  // Publishing is irreversible and reaches every student in the section at
  // once, so it needs the course code typed out, not a single click.
  if (confirmation !== sheet.course.code) {
    return fail(400, { confirmation: [`Type ${sheet.course.code} to confirm.`] }, req)
  }
  const missing = sheet.rows.filter((r) => r.marks === null)
  if (missing.length) {
    return fail(409, { detail: `${missing.length} student(s) have no mark.`, code: 'incomplete' }, req)
  }

  A.setMarksStatus('PUBLISHED')
  return json(
    {
      publishedCount: sheet.rows.length,
      audit: A.audit('MARKS_PUBLISH', `${sheet.course.code} ${sheet.assessment.label} published`),
    },
    200,
    req,
  )
})

// ------------------------------------------------------------ finance ledger

GET('/api/admin/finance/ledger/', ({ req, query }) => {
  const direction = query.get('direction')
  const rows = A.LEDGER.filter(
    (e) => !direction || direction === 'ALL' || (direction === 'IN' ? e.inbound : !e.inbound),
  )
  return cursored(rows, null, req)
})

// ---------------------------------------------------------------- settings

GET('/api/admin/settings/', ({ req }) => json(A.SETTINGS, 200, req))

route('PUT', '/api/admin/settings/', async ({ req }) => {
  const input = await body<{ version?: string; institution?: never; term?: never; toggles?: { key: string; enabled: boolean }[] }>(req)

  // Optimistic lock: two admins on the same page must not silently clobber.
  if (input.version !== A.SETTINGS.version) {
    return fail(
      409,
      { detail: 'Settings changed since you loaded this page. Reload and reapply.', code: 'stale_version' },
      req,
    )
  }

  const next = {
    ...A.SETTINGS,
    version: `v${Number(A.SETTINGS.version.slice(1)) + 1}`,
    institution: input.institution ?? A.SETTINGS.institution,
    term: { ...A.SETTINGS.term, ...(input.term ?? {}) },
    toggles: A.SETTINGS.toggles.map((t) => ({
      ...t,
      enabled: input.toggles?.find((x) => x.key === t.key)?.enabled ?? t.enabled,
    })),
  }
  A.setSettings(next)

  return json({ settings: next, audit: A.audit('SETTINGS_SAVE', 'Institution settings updated') }, 200, req)
})

// ----------------------------------------------------------------- support

GET('/api/admin/support/', ({ req }) =>
  json(
    {
      ...A.SUPPORT,
      tickets: A.SUPPORT.tickets.map((t) => ({
        ...t,
        status: A.TICKET_OVERRIDES[t.id] ?? t.status,
      })),
    },
    200,
    req,
  ),
)

PATCH('/api/admin/support/tickets/:id/', async ({ req, params }) => {
  const { status } = await body<{ status?: string }>(req)
  const ticket = A.SUPPORT.tickets.find((t) => t.id === params.id)
  if (!ticket) return notFound(req)
  A.TICKET_OVERRIDES[ticket.id] = status as never
  return json({ ...ticket, status, updatedAt: new Date().toISOString() }, 200, req)
})

// ---------------------------------------------------------------- pagination

function paginate<T>(rows: T[], query: URLSearchParams, path: string) {
  const size = Math.min(Number(query.get('page_size') ?? 20), 100)
  const page = Math.max(Number(query.get('page') ?? 1), 1)
  const start = (page - 1) * size
  const url = (p: number) => `http://localhost:${PORT}${path}?page=${p}&page_size=${size}`
  return {
    results: rows.slice(start, start + size),
    pagination: {
      count: rows.length,
      next: start + size < rows.length ? url(page + 1) : null,
      previous: page > 1 ? url(page - 1) : null,
    } satisfies PagePagination,
  }
}

// ===========================================================================
// Server
// ===========================================================================

const server = Bun.serve({
  port: PORT,
  idleTimeout: 60,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

    // Latency first, then the injected failure. Order matters: a failure that
    // returned instantly would roll an optimistic patch back before anyone
    // could see it had been applied, which defeats the point of the knob.
    const delay = Number(url.searchParams.get('_delay') ?? BASE_LATENCY)
    if (delay > 0) await Bun.sleep(delay)

    const forced = Number(url.searchParams.get('_fail'))
    if (forced >= 400) {
      return fail(forced, { detail: `Injected failure (${forced}).`, code: 'mock_failure' }, req)
    }

    const hit = match(req.method, url.pathname)
    if (!hit) return notFound(req)

    // Auth gate, so the 401 → refresh → retry path in use-api.ts gets exercised.
    if (
      url.pathname.startsWith('/api/student/') ||
      url.pathname.startsWith('/api/faculty/') ||
      url.pathname.startsWith('/api/admin/') ||
      url.pathname === '/api/me/'
    ) {
      if (!roleFromAuth(req)) {
        return fail(401, { detail: 'Given token not valid for any token type.', code: 'token_not_valid' }, req)
      }
    }

    try {
      return await hit.handler({ req, params: hit.params, query: url.searchParams })
    } catch (err) {
      console.error(`${req.method} ${url.pathname}`, err)
      return fail(500, { detail: String(err) }, req)
    }
  },
})

console.log(`mock api  →  http://localhost:${server.port}`)
console.log(`  ${routes.length} routes · ${BASE_LATENCY}ms latency · access token ${ACCESS_TTL}s`)
console.log(`  sign in as student / faculty / admin (any password)`)
console.log(`  ?_delay=1200 to slow a call · ?_fail=500 to break one`)

export { routes }
