/**
 * Smoke check for the mock API.  `bun run mock:test`
 *
 * Hits every GET route, the mutations that carry real logic, and the failure
 * paths the optimistic UI depends on. Asserts only what would actually break
 * something: status, non-empty body, and the handful of invariants worth
 * having (idempotent payments, 401 before auth, validation rejections).
 *
 * ponytail: plain asserts, no test framework. It fails loudly and exits 1.
 */

import { strict as assert } from 'node:assert'
import { routes } from './server.ts'

const BASE = `http://localhost:${Bun.env.MOCK_PORT ?? 8787}`
/** Latency off — this is a contract check, not a timing one. */
const Q = '?_delay=0'

/** Sample values for `:params`, so every parameterised route is reachable. */
const SAMPLES: Record<string, string> = {
  courseId: 'crs-9',
  offeringId: 'off-1',
  id: 'th-1',
}

/** Faculty routes reuse `:id` for different things, so they get their own map. */
const FACULTY_SAMPLES: Record<string, string> = {
  '/api/faculty/sections/:id/': 'sec-1',
  '/api/faculty/assignments/:id/submissions/': 'fasg-1',
  '/api/faculty/submissions/:id/': 'sub-1',
  '/api/admin/users/:id/security/': 'usr-1000',
  '/api/admin/admissions/:id/': 'app-0',
  '/api/student/services/requests/:id/': 'sr-1',
}

/**
 * Routes the generic loop cannot guess: a required query param, or an id that
 * only exists once something has been created. Value is appended to the URL,
 * or `null` to skip and cover it explicitly further down.
 */
const READ_OVERRIDES: Record<string, string | null> = {
  '/api/student/ai/assist/': '&context=student.dashboard',
  '/api/student/finance/payments/:id/': null, // needs a real intent — see writes
}

let token = ''
let failures = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ok   ${name}`)
  } catch (err) {
    failures++
    console.error(`  FAIL ${name}\n       ${(err as Error).message}`)
  }
}

const auth = () => ({ Authorization: `Bearer ${token}` })

/**
 * Mirrors `unwrap` in src/hooks/use-api.ts, so every assertion below reads the
 * payload a screen would see rather than the envelope around it. `raw` stays
 * available for the contract checks that are *about* the envelope.
 */
function unwrap(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || !('data' in raw) || !('meta' in raw)) return raw
  const { data, meta } = raw as { data: unknown; meta: { pagination?: object } }
  if (meta?.pagination) {
    if (Array.isArray(data)) return { ...meta.pagination, results: data }
    if (data && typeof data === 'object' && 'results' in data) return { ...data, ...meta.pagination }
  }
  return data
}

async function get(path: string, extra = '') {
  const res = await fetch(`${BASE}${path}${Q}${extra}`, { headers: auth() })
  const raw = res.status === 204 ? null : await res.json().catch(() => null)
  return { res, raw, body: unwrap(raw) }
}

async function send(method: string, path: string, payload?: unknown) {
  const res = await fetch(`${BASE}${path}${Q}`, {
    method,
    headers: { ...auth(), ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  })
  const raw = res.status === 204 ? null : await res.json().catch(() => null)
  return { res, raw, body: unwrap(raw) }
}

// --------------------------------------------------------------------- run

console.log('\nauth')

{
  const { res } = await get('/api/student/dashboard/')
  check('unauthenticated GET is 401', () => assert.equal(res.status, 401))
}

{
  const res = await fetch(`${BASE}/api/token/${Q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'student', password: 'anything' }),
  })
  const b = unwrap(await res.json()) as { access: string; refresh: string }
  token = b.access
  check('POST /api/token/ mints a pair', () => {
    assert.equal(res.status, 200)
    assert.ok(b.access && b.refresh, 'missing access/refresh')
  })

  const bad = await fetch(`${BASE}/api/token/${Q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nobody', password: 'x' }),
  })
  check('unknown user is 401', () => assert.equal(bad.status, 401))

  const refreshed = await fetch(`${BASE}/api/token/refresh/${Q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: b.refresh }),
  })
  check('refresh returns a new access token', () => assert.equal(refreshed.status, 200))
}

console.log('\nreads — every GET route')

const getRoutes = routes.filter((r) => r.method === 'GET')
assert.ok(getRoutes.length > 40, `expected 40+ GET routes, found ${getRoutes.length}`)

for (const r of getRoutes) {
  const template = `/${r.segments.join('/')}/`
  if (template in READ_OVERRIDES && READ_OVERRIDES[template] === null) continue

  const sample = FACULTY_SAMPLES[template]
  const path = sample
    ? template.replace(/:[^/]+/, sample)
    : `/${r.segments.map((s) => (s.startsWith(':') ? SAMPLES[s.slice(1)] ?? 'x' : s)).join('/')}/`
  const { res, body } = await get(path, READ_OVERRIDES[template] ?? '')
  check(`GET ${path}`, () => {
    assert.equal(res.status, 200, `status ${res.status}`)
    assert.ok(body && Object.keys(body).length > 0, 'empty body')
  })
}

{
  const { res } = await get('/api/student/ai/assist/', '&context=nope')
  check('unknown assistant context → 404', () => assert.equal(res.status, 404))
}

console.log('\nwrites')

{
  const { res, body } = await send('POST', '/api/student/lms/notes/', {
    title: 'Smoke note',
    body: 'created by the smoke check',
    tag: 'Trees',
  })
  const id = (body as { id: string }).id
  check('POST note → 201 with an id', () => {
    assert.equal(res.status, 201)
    assert.ok(id, 'no id returned')
  })

  const listed = await get('/api/student/lms/notes/')
  check('created note appears in the list', () =>
    assert.ok((listed.body as { results: { id: string }[] }).results.some((n) => n.id === id)),
  )

  const patched = await send('PATCH', `/api/student/lms/notes/${id}/`, { title: 'Renamed' })
  check('PATCH note applies', () => assert.equal((patched.body as { title: string }).title, 'Renamed'))

  const deleted = await send('DELETE', `/api/student/lms/notes/${id}/`)
  check('DELETE note → 204', () => assert.equal(deleted.res.status, 204))

  const gone = await send('DELETE', `/api/student/lms/notes/${id}/`)
  check('deleting twice → 404', () => assert.equal(gone.res.status, 404))
}

{
  const blank = await send('POST', '/api/student/lms/notes/', { title: '   ' })
  check('blank title → 422 with a field error', () => {
    assert.equal(blank.res.status, 422)
    const errors = (blank.raw as { errors?: { field: string }[] }).errors
    assert.ok(errors?.some((e) => e.field === 'title'), 'no field error for title')
  })
}

{
  const { res, body } = await send('POST', '/api/student/exams/revaluation/', {
    courseId: 'crs-9',
    examTypeId: 'et-1',
    reviewTypeId: 'rt-1',
    reason: 'Section B was marked against the wrong rubric.',
  })
  check('POST revaluation → 201 PENDING', () => {
    assert.equal(res.status, 201)
    assert.equal((body as { status: string }).status, 'PENDING')
  })

  const listed = await get('/api/student/exams/revaluation/')
  check('new request is prepended to the list', () =>
    assert.equal(
      (listed.body as { requests: { id: string }[] }).requests[0]!.id,
      (body as { id: string }).id,
    ),
  )
}

{
  const key = crypto.randomUUID()
  const payload = { amount: '6500.00', methodId: 'pm-1', invoiceIds: ['inv-2'], idempotencyKey: key }
  const first = await send('POST', '/api/student/finance/payments/', payload)
  const second = await send('POST', '/api/student/finance/payments/', payload)
  check('payment is idempotent under a replayed key', () => {
    assert.equal(first.res.status, 201)
    assert.equal(second.res.status, 200)
    assert.equal((first.body as { id: string }).id, (second.body as { id: string }).id)
  })

  const tooSmall = await send('POST', '/api/student/finance/payments/', {
    ...payload,
    amount: '10.00',
    idempotencyKey: crypto.randomUUID(),
  })
  check('below minimum → 422', () => assert.equal(tooSmall.res.status, 422))

  const noKey = await send('POST', '/api/student/finance/payments/', { ...payload, idempotencyKey: '' })
  check('missing idempotency key → 422', () => assert.equal(noKey.res.status, 422))

  const polled = await get(`/api/student/finance/payments/${(first.body as { id: string }).id}/`)
  check('payment intent is pollable and starts unsettled', () => {
    assert.equal(polled.res.status, 200)
    const p = polled.body as { status: string; redirectUrl: string | null }
    assert.equal(p.status, 'REDIRECT_REQUIRED')
    assert.ok(p.redirectUrl, 'no gateway redirect to hand off to')
  })
}

{
  const { res, body } = await send('POST', '/api/student/lms/quizzes/qz-2/attempts/', {
    answers: [
      { questionId: 'pq-1', optionId: 'pq-1-b' },
      { questionId: 'pq-2', optionId: 'pq-2-a' },
      { questionId: 'pq-3', optionId: 'pq-3-c' },
    ],
    elapsedSeconds: 240,
  })
  check('quiz attempt grades 2/3', () => {
    assert.equal(res.status, 201)
    const r = body as { correctCount: number; totalCount: number; scorePercent: number }
    assert.equal(r.correctCount, 2)
    assert.equal(r.totalCount, 3)
    assert.equal(r.scorePercent, 67)
  })
}

{
  const dup = await send('POST', '/api/student/academic/registration/courses/', { offeringId: 'off-1' })
  const again = await send('POST', '/api/student/academic/registration/courses/', { offeringId: 'off-1' })
  check('registering twice → 409', () => {
    assert.equal(dup.res.status, 201)
    assert.equal(again.res.status, 409)
  })

  const full = await send('POST', '/api/student/academic/registration/courses/', { offeringId: 'off-5' })
  check('full section → 409 seat_unavailable', () => {
    assert.equal(full.res.status, 409)
    assert.equal((full.body as { code: string }).code, 'seat_unavailable')
  })
}

console.log('\noptimistic-UI support')

{
  const res = await fetch(`${BASE}/api/student/lms/notes/?_fail=500`, { method: 'POST', headers: auth() })
  check('?_fail=500 replaces the handler', () => assert.equal(res.status, 500))

  const res409 = await fetch(`${BASE}/api/student/lms/notes/?_fail=409`, { headers: auth() })
  check('?_fail=409 works on reads too', () => assert.equal(res409.status, 409))

  // The rollback is only observable if the failure lands *after* the latency —
  // an instant 500 undoes the optimistic patch before it can be seen.
  const started = Date.now()
  const slowFail = await fetch(`${BASE}/api/student/lms/notes/?_fail=500&_delay=400`, {
    method: 'POST',
    headers: auth(),
  })
  check('_fail waits out _delay before failing', () => {
    assert.equal(slowFail.status, 500)
    assert.ok(Date.now() - started >= 400, 'failed instantly; the patch was never visible')
  })
}

{
  const started = Date.now()
  await fetch(`${BASE}/api/student/dashboard/?_delay=400`, { headers: auth() })
  check('?_delay holds the response', () => assert.ok(Date.now() - started >= 400))
}

console.log('\ntransport')

{
  const plain = await fetch(`${BASE}/api/student/lms/overview/${Q}`, {
    headers: { ...auth(), 'Accept-Encoding': 'identity' },
  })
  const raw = (await plain.arrayBuffer()).byteLength

  const zipped = await fetch(`${BASE}/api/student/academic/faculty/${Q}`, {
    headers: { ...auth(), 'Accept-Encoding': 'gzip' },
  })
  check('gzip is negotiated on payloads over 1 KB', () => {
    // Bun's fetch decodes transparently, so assert on the header, not the size.
    assert.equal(zipped.headers.get('content-encoding'), 'gzip')
    assert.equal(zipped.headers.get('vary'), 'Accept-Encoding')
  })
  check('small payloads are left uncompressed', () => assert.ok(raw > 0))
}

{
  const res = await fetch(`${BASE}/api/student/nope/`, { headers: auth() })
  const b = (await res.json()) as { type?: string; title?: string; status?: number; detail?: string }
  check('unknown route → 404 as an RFC 7807 problem', () => {
    assert.equal(res.status, 404)
    assert.equal(res.headers.get('content-type'), 'application/problem+json')
    assert.equal(typeof b.type, 'string')
    assert.equal(typeof b.title, 'string')
    assert.equal(b.status, 404)
    assert.equal(typeof b.detail, 'string')
  })
}

console.log('\nfaculty writes')

{
  // Faculty writes land on a student's transcript, so the server refuses
  // anything partial. These four are the guardrails, not edge cases.
  const partialRubric = await send('PUT', '/api/faculty/submissions/sub-1/grade/', {
    scores: [{ criterionId: 'rub-1', points: 30 }],
    feedback: 'good',
    release: true,
  })
  check('grading with a partial rubric → 422', () => assert.equal(partialRubric.res.status, 422))

  const overMax = await send('PUT', '/api/faculty/submissions/sub-1/grade/', {
    scores: [
      { criterionId: 'rub-1', points: 999 },
      { criterionId: 'rub-2', points: 20 },
      { criterionId: 'rub-3', points: 15 },
      { criterionId: 'rub-4', points: 10 },
    ],
    feedback: 'x',
    release: false,
  })
  check('a mark above the criterion max → 422', () => assert.equal(overMax.res.status, 422))

  const good = await send('PUT', '/api/faculty/submissions/sub-1/grade/', {
    scores: [
      { criterionId: 'rub-1', points: 36 },
      { criterionId: 'rub-2', points: 22 },
      { criterionId: 'rub-3', points: 18 },
      { criterionId: 'rub-4', points: 13 },
    ],
    feedback: 'Solid work; watch the deletion case.',
    release: true,
  })
  check('a complete rubric grades to 89 → A-', () => {
    assert.equal(good.res.status, 200)
    const r = good.body as { totalScore: number; grade: string; released: boolean }
    assert.equal(r.totalScore, 89)
    assert.equal(r.grade, 'A-')
    assert.equal(r.released, true)
  })
}

{
  const partial = await send('PUT', '/api/faculty/attendance/ses-sec-1-x/', {
    marks: [{ studentId: 'stu-1', mark: 'PRESENT' }],
  })
  check('a partial roster → 422 (unmarked is not absent)', () =>
    assert.equal(partial.res.status, 422),
  )

  const full = await send('PUT', '/api/faculty/attendance/ses-sec-1-x/', {
    marks: [
      { studentId: 'stu-1', mark: 'PRESENT' },
      { studentId: 'stu-2', mark: 'PRESENT' },
      { studentId: 'stu-3', mark: 'ABSENT' },
      { studentId: 'stu-4', mark: 'LATE' },
      { studentId: 'stu-5', mark: 'EXCUSED' },
    ],
  })
  check('a full roster submits; LATE counts as present', () => {
    assert.equal(full.res.status, 200)
    const r = full.body as { presentCount: number; totalCount: number }
    assert.equal(r.presentCount, 3)
    assert.equal(r.totalCount, 5)
  })
}

{
  const res = await send('PATCH', '/api/faculty/gradebook/', {
    entries: [
      { studentId: 'stu-1', columnId: 'col-3', points: 44 },
      { studentId: 'stu-2', columnId: 'col-3', points: 999 },
      { studentId: 'stu-3', columnId: 'col-nope', points: 10 },
    ],
  })
  check('gradebook saves good cells and reports bad ones', () => {
    assert.equal(res.res.status, 200)
    const r = res.body as { saved: number; rejected: unknown[] }
    assert.equal(r.saved, 1, 'the valid cell should have landed')
    assert.equal(r.rejected.length, 2, 'both bad cells should come back with reasons')
  })

  const sheet = await get('/api/faculty/gradebook/', '&sectionId=sec-1')
  check('the saved cell persists and completes the row total', () => {
    const rows = (sheet.body as { rows: { student: { id: string }; total: number | null }[] }).rows
    assert.equal(rows.find((r) => r.student.id === 'stu-1')?.total, 90)
    assert.equal(rows.find((r) => r.student.id === 'stu-2')?.total, null, 'rejected cell must not persist')
  })
}

{
  const res = await send('PATCH', '/api/faculty/profile/', { designation: 'Dean' })
  check('editing a registrar-owned field → 403', () => {
    assert.equal(res.res.status, 403)
    assert.equal((res.body as { code: string }).code, 'read_only_field')
  })

  const ok = await send('PATCH', '/api/faculty/profile/', { officeRoom: 'Room 210' })
  check('editing a self-owned field succeeds', () => assert.equal(ok.res.status, 200))
}

console.log('\nadmin — scale, blast radius, irreversibility')

{
  // 137 users: the directory has to paginate and search server-side, because
  // "fetch it all and filter in the browser" is not an option at 12,000.
  const p1 = await get('/api/admin/users/', '&page=1&page_size=20')
  const b1 = p1.body as { count: number; next: string | null; results: { id: string }[] }
  check('user directory paginates', () => {
    assert.equal(b1.results.length, 20)
    assert.ok(b1.count > 100, `expected a large directory, got ${b1.count}`)
    assert.ok(b1.next, 'no next page link')
  })

  const p2 = await get('/api/admin/users/', '&page=2&page_size=20')
  const b2 = p2.body as { results: { id: string }[] }
  check('page 2 returns different rows', () =>
    assert.notEqual(b1.results[0]!.id, b2.results[0]!.id),
  )

  const filtered = await get('/api/admin/users/', '&role=faculty')
  const bf = filtered.body as { results: { role: string }[] }
  check('role filter is applied server-side', () => {
    assert.ok(bf.results.length > 0)
    assert.ok(bf.results.every((u) => u.role === 'faculty'))
  })

  const searched = await get('/api/admin/users/', '&q=U-1003')
  const bs = searched.body as { count: number; results: { reference: string }[] }
  check('search matches on reference', () => {
    assert.equal(bs.count, 1)
    assert.equal(bs.results[0]!.reference, 'U-1003')
  })
}

{
  const noReason = await send('PATCH', '/api/admin/users/usr-1000/status/', {
    status: 'SUSPENDED',
  })
  check('suspending without a reason → 422', () => assert.equal(noReason.res.status, 422))

  const ok = await send('PATCH', '/api/admin/users/usr-1000/status/', {
    status: 'SUSPENDED',
    reason: 'Credential sharing reported by IT.',
  })
  check('a reasoned suspension returns an audit entry', () => {
    assert.equal(ok.res.status, 200)
    const r = ok.body as { audit: { summary: string; actorName: string } }
    assert.ok(r.audit.summary.includes('SUSPENDED'))
    assert.ok(r.audit.actorName)
  })

  const listed = await get('/api/admin/users/', '&q=U-1000')
  check('the status change persists in the directory', () =>
    assert.equal((listed.body as { results: { status: string }[] }).results[0]!.status, 'SUSPENDED'),
  )
}

{
  // Revoking your own session mid-incident is not a recoverable state.
  const own = await send('DELETE', '/api/admin/users/usr-1000/sessions/usr-1000-s1/')
  check('revoking the current session → 409', () => {
    assert.equal(own.res.status, 409)
    assert.equal((own.body as { code: string }).code, 'current_session')
  })

  const other = await send('DELETE', '/api/admin/users/usr-1000/sessions/usr-1000-s2/')
  check('revoking another session succeeds and audits', () =>
    assert.equal(other.res.status, 200),
  )

  const after = await get('/api/admin/users/usr-1000/security/')
  check('the revoked session is gone', () =>
    assert.ok(
      !(after.body as { sessions: { id: string }[] }).sessions.some((x) => x.id === 'usr-1000-s2'),
    ),
  )
}

{
  const noTemplate = await send('POST', '/api/admin/admissions/app-0/decision/', {
    status: 'APPROVED',
    templateId: null,
    note: 'Strong candidate.',
  })
  check('approving without an offer template → 422', () =>
    assert.equal(noTemplate.res.status, 422),
  )

  const ok = await send('POST', '/api/admin/admissions/app-0/decision/', {
    status: 'APPROVED',
    templateId: 'tpl-1',
    note: 'Strong candidate.',
  })
  check('a complete approval queues the offer letter', () => {
    assert.equal(ok.res.status, 200)
    assert.equal((ok.body as { notificationQueued: boolean }).notificationQueued, true)
  })

  const again = await send('POST', '/api/admin/admissions/app-0/decision/', {
    status: 'REJECTED',
    templateId: null,
    note: 'Changed my mind.',
  })
  check('re-deciding a decided application → 409', () => {
    assert.equal(again.res.status, 409)
    assert.equal((again.body as { code: string }).code, 'already_decided')
  })
}

{
  // slot-3 and slot-4 sit at the same instant; slot-3 already holds Hall 303.
  const clash = await send('PATCH', '/api/admin/exams/schedule/slot-4/', {
    hallId: 'hall-3',
    proctorId: 'prc-3',
  })
  check('double-booking a hall at the same sitting → 409', () => {
    assert.equal(clash.res.status, 409)
    assert.equal((clash.body as { code: string }).code, 'hall_clash')
  })

  const ok = await send('PATCH', '/api/admin/exams/schedule/slot-4/', {
    hallId: 'hall-4',
    proctorId: 'prc-3',
  })
  check('a free hall assigns and confirms the slot', () => {
    assert.equal(ok.res.status, 200)
    const slot = (ok.body as { slots: { id: string; state: string }[] }).slots.find(
      (s) => s.id === 'slot-4',
    )
    assert.equal(slot?.state, 'CONFIRMED')
  })

  const sameHallLaterDay = await send('PATCH', '/api/admin/exams/schedule/slot-3/', {
    hallId: 'hall-1',
    proctorId: 'prc-3',
  })
  check('the same hall on a different day is not a clash', () =>
    assert.equal(sameHallLaterDay.res.status, 200),
  )
}

{
  const stale = await send('PUT', '/api/admin/settings/', {
    version: 'v0',
    toggles: [{ key: 'payments', enabled: true }],
  })
  check('saving settings with a stale version → 409', () => {
    assert.equal(stale.res.status, 409)
    assert.equal((stale.body as { code: string }).code, 'stale_version')
  })

  const current = await get('/api/admin/settings/')
  const version = (current.body as { version: string }).version
  const ok = await send('PUT', '/api/admin/settings/', {
    version,
    toggles: [{ key: 'payments', enabled: true }],
  })
  check('a current version saves and bumps the lock', () => {
    assert.equal(ok.res.status, 200)
    const r = ok.body as { settings: { version: string; toggles: { key: string; enabled: boolean }[] } }
    assert.notEqual(r.settings.version, version, 'version must change so a second save cannot replay')
    assert.equal(r.settings.toggles.find((t) => t.key === 'payments')?.enabled, true)
  })

  const replay = await send('PUT', '/api/admin/settings/', {
    version,
    toggles: [{ key: 'payments', enabled: false }],
  })
  check('replaying the old version is rejected', () => assert.equal(replay.res.status, 409))
}

{
  // Publishing marks reaches every student in the section at once.
  const partial = await send('POST', '/api/admin/exams/marks/publish/', {
    confirmation: 'wrong',
  })
  check('publishing without the typed course code → 422', () =>
    assert.equal(partial.res.status, 422),
  )

  const incomplete = await send('POST', '/api/admin/exams/marks/publish/', {
    confirmation: 'CSE-301',
  })
  check('publishing with empty marks → 409', () => {
    assert.equal(incomplete.res.status, 409)
    assert.equal((incomplete.body as { code: string }).code, 'incomplete')
  })

  const fill = await send('PATCH', '/api/admin/exams/marks/', {
    entries: [
      { studentId: 'mstu-2', marks: 22 },
      { studentId: 'mstu-4', marks: 19 },
      { studentId: 'nobody', marks: 5 },
    ],
  })
  check('marks save partially, rejecting an unenrolled student', () => {
    const r = fill.body as { saved: number; rejected: unknown[] }
    assert.equal(r.saved, 2)
    assert.equal(r.rejected.length, 1)
  })

  const published = await send('POST', '/api/admin/exams/marks/publish/', {
    confirmation: 'CSE-301',
  })
  check('a complete sheet publishes and audits', () => {
    assert.equal(published.res.status, 200)
    assert.equal((published.body as { publishedCount: number }).publishedCount, 5)
  })

  const locked = await send('PATCH', '/api/admin/exams/marks/', {
    entries: [{ studentId: 'mstu-0', marks: 30 }],
  })
  check('the sheet locks once published', () => {
    assert.equal(locked.res.status, 409)
    assert.equal((locked.body as { code: string }).code, 'locked')
  })
}

// --------------------------------------------------------------- contract

console.log('\nresponse contract')

{
  const { res, raw } = await get('/api/student/dashboard/')
  const env = raw as { data?: unknown; meta?: { requestId?: string; timestamp?: string } }
  check('a 2xx body is { data, meta }', () => {
    assert.equal(res.status, 200)
    assert.ok(env.data, 'no data member')
    assert.equal(typeof env.meta?.requestId, 'string')
    assert.equal(typeof env.meta?.timestamp, 'string')
  })
  check('meta.requestId echoes the X-Request-Id header', () =>
    assert.equal(res.headers.get('x-request-id'), env.meta?.requestId),
  )
  check('an unpaged response carries no meta.pagination', () =>
    assert.equal((env.meta as { pagination?: unknown }).pagination, undefined),
  )
}

{
  const { raw, body } = await get('/api/student/academic/faculty/')
  const env = raw as { data?: unknown; meta?: { pagination?: { count?: number } } }
  check('a paged list puts rows in data and paging in meta', () => {
    assert.ok(Array.isArray(env.data), 'data is not an array')
    assert.equal(typeof env.meta?.pagination?.count, 'number')
  })
  check('the client folds paging back onto the rows', () => {
    const page = body as { count: number; results: unknown[] }
    assert.equal(typeof page.count, 'number')
    assert.ok(Array.isArray(page.results))
  })
}

{
  const { raw, body } = await get('/api/student/lms/forum/threads/')
  check('a cursored list surfaces nextCursor through meta', () => {
    assert.ok(Array.isArray((raw as { data?: unknown }).data))
    assert.ok('nextCursor' in (body as object))
  })
}

{
  const res = await fetch(`${BASE}/api/student/lms/notes/${Q}&_fail=409`, { headers: auth() })
  const p = (await res.json()) as { type: string; code?: string; requestId?: string }
  check('an injected failure is a problem with a dereferenceable type', () => {
    assert.equal(res.headers.get('content-type'), 'application/problem+json')
    assert.ok(p.type.startsWith('https://'), `type was ${p.type}`)
    assert.equal(p.code, 'mock_failure')
    assert.equal(res.headers.get('x-request-id'), p.requestId)
  })
}

{
  const blank = await send('POST', '/api/student/lms/notes/', { title: '' })
  const p = blank.raw as { code?: string; errors?: { field: string; code: string; detail: string }[] }
  check('a validation problem carries a typed errors array', () => {
    assert.equal(blank.res.status, 422)
    assert.equal(p.code, 'validation_failed')
    const first = p.errors?.[0]
    assert.equal(first?.field, 'title')
    assert.equal(first?.code, 'blank')
    assert.equal(typeof first?.detail, 'string')
  })
}

console.log(failures === 0 ? '\nall checks passed\n' : `\n${failures} check(s) failed\n`)
process.exit(failures === 0 ? 0 : 1)
