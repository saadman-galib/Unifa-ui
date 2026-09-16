import { expect, test } from 'bun:test'
import { ApiError, unwrap } from './use-api.ts'

/**
 * The two functions that carry the whole response contract
 * (docs/api/contract.md). Everything else in use-api.ts is react-query
 * plumbing; these two are the parsing, and parsing is where it breaks.
 */

// ------------------------------------------------------------------ unwrap

test('strips the envelope', () => {
  expect(unwrap<{ id: string }>({ data: { id: 'inv-2' }, meta: { requestId: 'r1' } })).toEqual({
    id: 'inv-2',
  })
})

test('folds page paging onto a bare list', () => {
  const page = unwrap<{ count: number; next: string | null; results: { id: string }[] }>({
    data: [{ id: 'usr-1' }],
    meta: { requestId: 'r1', pagination: { count: 240, next: '/api/x/?page=2', previous: null } },
  })
  expect(page.count).toBe(240)
  expect(page.next).toBe('/api/x/?page=2')
  expect(page.results).toEqual([{ id: 'usr-1' }])
})

test('folds cursor paging onto a bare list', () => {
  const feed = unwrap<{ nextCursor: string | null; results: unknown[] }>({
    data: [{ id: 'th-9' }],
    meta: { requestId: 'r1', pagination: { nextCursor: 'cD05' } },
  })
  expect(feed.nextCursor).toBe('cD05')
  expect(feed.results).toHaveLength(1)
})

test('folds paging onto a screen payload that contains the list', () => {
  const screen = unwrap<{ metrics: unknown[]; count: number; results: unknown[] }>({
    data: { metrics: [{ label: 'Total users' }], results: [{ id: 'usr-1' }] },
    meta: { requestId: 'r1', pagination: { count: 137, next: null, previous: null } },
  })
  expect(screen.count).toBe(137)
  expect(screen.metrics).toHaveLength(1)
  expect(screen.results).toHaveLength(1)
})

test('leaves an unenveloped body alone', () => {
  // A 204 parses to null, and any hop that never reached the app sends
  // something that is not ours. Neither may be mangled into a payload.
  expect(unwrap(null)).toBeNull()
  expect(unwrap<{ access: string }>({ access: 'tok' })).toEqual({ access: 'tok' })
})

test('does not unwrap a payload that merely has a data field', () => {
  const chart = { data: [1, 2, 3], label: 'GPA' }
  expect(unwrap<typeof chart>(chart)).toEqual(chart)
})

// ---------------------------------------------------------------- ApiError

test('parses a problem and exposes code and detail', () => {
  const err = new ApiError(409, {
    type: 'https://api.unigpt.edu/problems/seat-unavailable',
    title: 'Conflict',
    status: 409,
    detail: 'CS-401 Section B filled while you were deciding.',
    code: 'seat_unavailable',
  })
  expect(err.status).toBe(409)
  expect(err.code).toBe('seat_unavailable')
  expect(err.detail).toBe('CS-401 Section B filled while you were deciding.')
  // The thrown message is the prose, so an unhandled rejection reads sensibly.
  expect(err.message).toBe('CS-401 Section B filled while you were deciding.')
})

test('finds a field error by name, and returns undefined for an accepted field', () => {
  const err = new ApiError(422, {
    type: 'https://api.unigpt.edu/problems/validation-failed',
    title: 'Validation failed',
    status: 422,
    code: 'validation_failed',
    errors: [
      { field: 'phone', code: 'invalid', detail: 'Enter a valid phone number.' },
      { field: 'officeRoom', code: 'read_only_field', detail: 'The registrar owns this field.' },
    ],
  })
  expect(err.fieldError('phone')).toBe('Enter a valid phone number.')
  expect(err.fieldError('officeRoom')).toBe('The registrar owns this field.')
  expect(err.fieldError('email')).toBeUndefined()
})

test('returns the first rejection when a field fails twice', () => {
  const err = new ApiError(422, {
    type: 'about:blank',
    title: 'Validation failed',
    status: 422,
    errors: [
      { field: 'amount', code: 'min_value', detail: 'Minimum payable is 500.00.' },
      { field: 'amount', code: 'invalid', detail: 'Enter a valid amount.' },
    ],
  })
  expect(err.fieldError('amount')).toBe('Minimum payable is 500.00.')
})

test('parses UniFa { error, details.fieldErrors } bodies', () => {
  const err = new ApiError(400, {
    error: 'Validation failed',
    details: { formErrors: [], fieldErrors: { email: ['Invalid email'] } },
  })
  expect(err.detail).toBe('Validation failed')
  expect(err.fieldError('email')).toBe('Invalid email')
})

test('falls back to about:blank for anything that never reached the app', () => {
  // A proxy 502 serves HTML; a dropped connection serves nothing.
  const err = new ApiError(502, '<html>Bad Gateway</html>')
  expect(err.problem.type).toBe('about:blank')
  expect(err.problem.status).toBe(502)
  expect(err.code).toBeUndefined()
  expect(err.fieldError('anything')).toBeUndefined()

  expect(new ApiError(500, null).problem.title).toBe('Request failed with 500')
})
