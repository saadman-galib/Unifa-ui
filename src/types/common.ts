/**
 * Wire-format primitives shared by every persona.
 *
 * These describe what crosses the network, not what a component renders.
 * Nothing here is pre-formatted for display: dates are ISO-8601, money is a
 * decimal string, enums are SCREAMING_SNAKE. Formatting happens at the edge
 * with `src/lib/format.ts`.
 *
 * See docs/api/student.md §1 for the reasoning.
 */

// --------------------------------------------------------------- scalars

/** ISO-8601 date, no time: `2026-05-25`. Use for anything without a clock. */
export type ISODate = string

/** ISO-8601 instant in UTC: `2026-05-25T18:00:00Z`. Always UTC, always `Z`. */
export type ISODateTime = string

/** Local wall-clock time, no date, no zone: `14:30`. Timetable slots only. */
export type TimeOfDay = string

/**
 * Decimal amount as a string: `"48500.00"`.
 *
 * DRF serialises `DecimalField` to a string by default and we keep it that
 * way — floats lose paisa on sums. Render with `money()`, never with `+`.
 */
export type Money = string

/** Server-assigned opaque identifier. Never parse it, never sort on it. */
export type Id = string

/** ISO-4217. The portal is single-currency today; the field exists so a
 *  second campus does not become a migration. */
export type CurrencyCode = 'BDT'

// ------------------------------------------------------------- the envelope

/**
 * Every 2xx body on the wire. One shape, no exceptions — see
 * [docs/api/contract.md](../../docs/api/contract.md) §2.
 *
 * You will almost never name this type: `apiFetch` unwraps it at the single
 * chokepoint, so hooks and screens see `T` (or `Paginated<T>`), never the
 * envelope. It exists so the parser and the backend doc agree on one thing.
 */
export type Envelope<T> = {
  data: T
  meta: Meta
}

/**
 * Envelope sidecar. Everything here is *about* the response rather than part
 * of it — which is exactly why it does not belong inside `data`.
 */
export type Meta = {
  /** Echoes `X-Request-Id`. Quote it in a bug report and the log is findable. */
  requestId: string
  /** Present only when `data` is a list that the server paged. */
  pagination?: Pagination
  /** RFC 3339. The server's clock, for cache-age and clock-skew debugging. */
  timestamp?: ISODateTime
}

/** Page-number paging: the default for anything with a stable row order. */
export type PagePagination = {
  count: number
  /** Absolute URLs, or null at the edges. Pass back verbatim; never rebuild. */
  next: string | null
  previous: string | null
}

/** Cursor paging, for feeds where rows arrive while you page. */
export type CursorPagination = {
  /** Opaque; pass as `?cursor=`. Null means the end. */
  nextCursor: string | null
}

export type Pagination = PagePagination | CursorPagination

/**
 * A paged list as `apiFetch` hands it back — `meta.pagination` folded onto the
 * rows so a screen has one object, not two. The wire shape is
 * `Envelope<T[]>` with `meta.pagination`; this is the client-side view of it.
 */
export type Paginated<T> = PagePagination & { results: T[] }

/** The cursor equivalent. Same folding, same reason. */
export type Cursored<T> = CursorPagination & { results: T[] }

// -------------------------------------------------------------- the problem

/**
 * Every non-2xx body: RFC 7807 Problem Details, plus our extension members.
 * Served as `application/problem+json`. See docs/api/contract.md §3.
 *
 *   {
 *     "type": "https://api.unigpt.edu/problems/seat-unavailable",
 *     "title": "No seats remaining",
 *     "status": 409,
 *     "detail": "CS-401 Section B filled while you were deciding.",
 *     "instance": "/api/student/academic/registration/courses/",
 *     "code": "seat_unavailable",
 *     "requestId": "01JT3K…"
 *   }
 *
 * Branch on `code`, never on `title` or `detail` — those are copy and will
 * be rewritten without a version bump.
 */
export type Problem = {
  /** Absolute URI naming the problem kind. `about:blank` for plain statuses. */
  type: string
  /** Short human summary, stable per `type`. Safe as a heading. */
  title: string
  status: number
  /** This occurrence, in prose. Safe to show a user. */
  detail?: string
  /** URI of the request that failed. */
  instance?: string

  // ------------------------------------------------------------- extensions
  /** Machine-readable reason. The only field worth branching on. */
  code?: string
  /** Per-field rejections. Present on 422, absent everywhere else. */
  errors?: FieldError[]
  /** Echoes `meta.requestId` from the success path, for the same reason. */
  requestId?: string
  /** Contract-declared extras (`stale_version`, `retryAfter`, `blockedReason`…). */
  [extension: string]: unknown
}

/** One rejected field. An array, not a map: a field can fail twice. */
export type FieldError = {
  /** Dotted path into the request body: `scores.2.points`. */
  field: string
  /** Machine-readable: `blank`, `invalid`, `read_only_field`, `min_value`. */
  code: string
  /** Human-readable, already localised. */
  detail: string
}

// -------------------------------------------------------------- presentation

/**
 * Status colour, decided server-side.
 *
 * This is the one presentation concept that stays on the wire: the threshold
 * that makes 74% attendance `warning` and 92% `success` is institutional
 * policy, not a frontend constant. Kept identical to `MetricTone` in
 * `components/patterns/metric-card` so a wire value is always renderable.
 */
export type Tone = 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger'

/** `Tone` plus the greyed-out variant only `Badge` supports. */
export type BadgeTone = Tone | 'neutral'

/** A server-computed summary tile. `icon` is a lucide-react export name. */
export type Metric = {
  label: string
  /** Pre-rounded for display — the server owns the rounding rule. */
  value: string
  tone: Tone
  icon?: string
  /** Suffix rendered small next to the value: `/ 120`. */
  unit?: string
  /** 0–100, drives the ring/bar when present. */
  progress?: number
  badge?: { label: string; tone: BadgeTone }
}

// -------------------------------------------------------------------- auth

export type Role = 'student' | 'faculty' | 'admin'

/** `POST /api/v1/auth/login` */
export type TokenRequest = { email: string; password: string }
export type TokenResponse = { token: string }

/** `POST /api/token/refresh/` */
export type RefreshRequest = { refresh: string }
export type RefreshResponse = { access: string }

/** `GET /api/me/` — the full profile the JWT claims only summarise. */
export type Me = {
  id: Id
  role: Role
  fullName: string
  email: string
  avatarUrl: string | null
  /** `21-44390-1` — the registrar's number, not the database id. */
  registrationNo: string | null
  department: string | null
  programme: string | null
  /** Currently active term, so screens do not each ask for it. */
  currentTerm: Term | null
}

export type Term = {
  id: Id
  /** `Spring 2026` */
  name: string
  startsOn: ISODate
  endsOn: ISODate
  isCurrent: boolean
}

// ------------------------------------------------------- academic entities

/**
 * Entities every persona sees. A student reads their attendance mark, a
 * faculty member sets it, an admin audits it — same shape, three verbs.
 */

/** A course as it appears in any list. */
export type CourseRef = {
  id: Id
  /** `CS-401` — registrar code, shown everywhere. */
  code: string
  title: string
  credits: number
}

export type Instructor = {
  id: Id
  name: string
  /** `Professor of AI & Robotics` */
  title: string | null
  email: string | null
  avatarUrl: string | null
  officeRoom: string | null
}

/** Letter grade as awarded. `null` while ungraded — never `"N/A"`. */
export type LetterGrade = string | null

export type AttendanceMark = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'PENDING'

export type Attachment = {
  id: Id
  filename: string
  /** Bytes. Format with `fileSize()`; the server does not pre-format. */
  sizeBytes: number
  mimeType: string
  /** Pre-signed and short-lived. Do not cache in app state. */
  url: string
  uploadedAt: ISODateTime
}
