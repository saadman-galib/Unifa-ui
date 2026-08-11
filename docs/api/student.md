# Student API Contract

Everything the student portal sends and receives. 63 GET, 28 write endpoints,
covering 65 student screens in [screen-inventory.md](../screen-inventory.md)
(60 original + 5 My Profile).

- **Types:** [`src/types/common.ts`](../../src/types/common.ts), [`src/types/student.ts`](../../src/types/student.ts) — import from `@/types`
- **Mock server:** `bun run mock` → `http://localhost:8787` ([mock/server.ts](../../mock/server.ts))
- **Check it:** `bun run mock:test`

Sections 1 and 8 are persona-neutral. They move to `docs/api/general.md` once
faculty and admin get their own contracts; until then they live here so this
document is usable on its own.

---

## 1. Conventions

Base URL, data formats, envelopes, transport, compression, caching, errors and
auth are the same for all three personas and live in
**[general.md](general.md)**. Read that first; this document covers only what
is specific to students.

The two that come up most often here:

- **The wire carries values, not strings.** ISO-8601 UTC instants, decimal
  money strings, bytes, seconds, `null` instead of `"N/A"`. Formatting happens
  at the edge with [`src/lib/format.ts`](../../src/lib/format.ts).
- **Errors are DRF-shaped.** `ApiError.body` is field-keyed; branch on `code`
  when present, never on the human-readable `detail`.

---

## 2. Shape of the API

### 2.1 Screen-shaped, deliberately

Most GETs return everything one screen needs in one round trip.
`/api/student/lms/assignments/` returns the metric tiles *and* the assignment
list, because the tiles are server-computed aggregates over the same query.

This is a backend-for-frontend choice, and the tradeoff is real:

- **Buys:** one request per screen instead of four; no client-side fan-out
  waterfall; aggregates computed where the data is.
- **Costs:** endpoints are coupled to screens, so a redesign can require a
  serializer change.

At 60 screens with a single consumer, the coupling is cheap and the round
trips are not. Where a resource is genuinely reused across screens — courses,
notes, forum threads — it also gets a plain resource endpoint.

### 2.2 The assistant panel is separate — always

`AssistantResponse` is **never** embedded in a screen payload.

The panel appears on ~12 screens and its copy is model-generated. Inlining it
would put a 2–4s model call in front of a 200ms dashboard, and a model outage
would blank the page instead of the panel.

```
GET /api/student/ai/assist/?context=lms.assignments  →  AssistantResponse
```

`<ConnectedAssistant context="…" />`
([assistant-panel.tsx](../../src/components/patterns/assistant-panel.tsx))
fetches it with `staleTime: 5min` and `retry: false`, and renders nothing on
failure. Known contexts: `student.dashboard`, `academic.courses`,
`academic.curriculum`, `academic.routine`, `academic.faculty`,
`academic.classrooms`, `academic.drop-add`, `lms.assignments`,
`lms.assignment-detail`, `attendance.overview`, `attendance.by-course`,
`exams.schedule`. Unknown context → 404, panel renders nothing.

### 2.3 Query keys

`[module, resource, ...params]`, matching
[architecture.md §5](../architecture.md#5-data). The key a mutation
invalidates must equal the key the list reads, or the optimistic patch lands
in a cache nobody is watching.

```ts
['student', 'dashboard']
['lms', 'notes']
['lms', 'assignments', id]
['ai', 'assist', 'lms.assignments']
```

---

## 3. Endpoints

`R` = request body type, `→` = response type. All under `/api/student/`
unless shown otherwise. Types are in [`src/types/student.ts`](../../src/types/student.ts).

### 3.1 Identity & dashboard

| Method | Path | R → | Screen |
|---|---|---|---|
| POST | `/api/token/` | `TokenRequest` → `TokenResponse` | Login |
| POST | `/api/token/refresh/` | `RefreshRequest` → `RefreshResponse` | — |
| GET | `/api/me/` | → `Me` | Topbar, profile |
| GET | `dashboard/` | → `StudentDashboardResponse` | `/student` |
| GET | `ai/assist/?context=` | → `AssistantResponse` | ~12 screens |

### 3.2 Academic — 11 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `academic/courses/` | → `MyCoursesResponse` | My Courses |
| GET | `academic/curriculum/` | → `CurriculumResponse` | Curriculum |
| GET | `academic/degree-progress/` | → `DegreeProgressResponse` | Degree Progress |
| GET | `academic/credits/` | → `CreditProgressResponse` | Credit Progress |
| GET | `academic/routine/` | → `ClassRoutineResponse` | Class Routine |
| GET | `academic/calendar/?month=YYYY-MM` | → `AcademicCalendarResponse` | Calendar |
| GET | `academic/faculty/?q=&department=&page=` | → `Paginated<FacultyDirectoryEntry>` | Faculty Directory |
| GET | `academic/classrooms/` | → `ClassroomsResponse` | Classrooms |
| GET | `academic/registration/semester/` | → `SemesterRegistrationResponse` | Semester Reg. |
| POST | `academic/registration/semester/` | `SemesterRegistrationRequest` → `SemesterRegistrationResponse` (202) | Semester Reg. |
| GET | `academic/registration/courses/?q=&department=&page=` | → `Paginated<CourseOffering>` | Course Reg. |
| POST | `academic/registration/courses/` | `AddCourseRequest` → `CourseOffering` (201) | Course Reg. |
| DELETE | `academic/registration/courses/{offeringId}/` | → 204 | Course Reg. |
| GET | `academic/registration/drop-add/` | → `DropAddResponse` | Drop / Add |
| POST | `academic/registration/drop-add/` | `DropAddRequest` → `DropAddResult` (201) | Drop / Add |

`?month=` is echoed back in `AcademicCalendarResponse.month` so a slow
response for a month the user already navigated past can be discarded.

`CourseOffering.canRegister` + `blockedReason`: the server decides
eligibility. The button is **disabled with the reason shown**, never hidden —
a missing row reads as a bug.

### 3.3 LMS — 17 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `lms/overview/` | → `LmsOverviewResponse` | LMS Overview |
| GET | `lms/courses/` | → `LmsCoursesResponse` | My Courses |
| GET | `lms/courses/{courseId}/lectures/` | → `LecturesResponse` | Video Lectures |
| GET | `lms/courses/{courseId}/materials/` | → `MaterialsResponse` | Course Materials |
| POST | `lms/lectures/{id}/progress/` | `LectureProgressRequest` → 204 | Video Lectures |
| GET | `lms/assignments/?state=` | → `AssignmentsResponse` | Assignments |
| GET | `lms/assignments/{id}/` | → `AssignmentDetailResponse` | Submission |
| POST | `lms/assignments/{id}/submissions/` | multipart → `Submission` (201) | Submission |
| GET | `lms/quizzes/` | → `QuizzesResponse` | Quizzes |
| GET | `lms/quizzes/{id}/practice/` | → `PracticeQuizResponse` | Practice Quiz |
| POST | `lms/quizzes/{id}/attempts/` | `QuizAttemptRequest` → `QuizAttemptResult` (201) | Practice Quiz |
| GET | `lms/live/` | → `LiveClassesResponse` | Live Classes |
| GET | `lms/recordings/` | → `RecordingsResponse` | Recordings |
| GET | `lms/downloads/` | → `DownloadsResponse` | Downloads |
| GET | `lms/forum/threads/?courseId=&cursor=` | → `Cursored<ForumThread>` | Forum |
| GET | `lms/forum/threads/{id}/` | → `ForumThreadDetailResponse` | Forum |
| POST | `lms/forum/threads/` | `CreateThreadRequest` → `ForumThread` (201) | Forum |
| POST | `lms/forum/threads/{id}/replies/` | `CreateReplyRequest` → `ForumReply` (201) | Forum |
| GET | `lms/notes/?q=&tag=&page=` | → `Paginated<Note>` | Notes |
| POST | `lms/notes/` | `CreateNoteRequest` → `Note` (201) | Notes |
| PATCH | `lms/notes/{id}/` | `UpdateNoteRequest` → `Note` | Notes |
| DELETE | `lms/notes/{id}/` | → 204 | Notes |
| GET | `lms/progress/` | → `LearningProgressResponse` | Learning Progress |
| GET | `lms/analytics/` | → `LearningAnalyticsResponse` | Learning Analytics |
| GET | `lms/announcements/` | → `AnnouncementsResponse` | Announcements |
| POST | `lms/announcements/{id}/read/` | → 204 | Announcements |
| GET | `lms/gradebook/` | → `GradebookResponse` | Gradebook |

### 3.4 Attendance — 5 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `attendance/overview/` | → `AttendanceOverviewResponse` | Overview |
| GET | `attendance/daily/?date=YYYY-MM-DD` | → `DailyAttendanceResponse` | Daily |
| GET | `attendance/by-course/?courseId=` | → `CourseAttendanceResponse` | By Course |
| GET | `attendance/history/` | → `AttendanceHistoryResponse` | History |
| GET | `attendance/analytics/` | → `AttendanceAnalyticsResponse` | Analytics |

Attendance is **read-only for students.** Marks are set by faculty. There is
no student-facing write here and there must not be one.

`CourseAttendanceResponse.requiredPercent` ships the institutional threshold
(75) rather than hardcoding it — policy belongs to the registrar.

`courseId` is a query param, not a path segment, because the screen has no
course picker in the design: omitting it asks the server for the course the
student is most at risk in.

### 3.5 Examinations — 9 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `exams/overview/` | → `ExamOverviewResponse` | Overview |
| GET | `exams/schedule/` | → `ExamScheduleResponse` | Schedule |
| GET | `exams/upcoming/` | → `UpcomingExamsResponse` | Upcoming |
| GET | `exams/admit-card/?termId=` | → `AdmitCardResponse` | Admit Card |
| GET | `exams/results/?termId=` | → `ExamResultsResponse` | Results |
| GET | `exams/grade-report/` | → `GradeReportResponse` | Grade Report |
| GET | `exams/revaluation/` | → `RevaluationResponse` | Revaluation |
| POST | `exams/revaluation/` | `CreateRevaluationRequest` → `RevaluationRequestRow` (201) | Revaluation |
| GET | `exams/attendance/` | → `ExamAttendanceResponse` | Attendance Sheet |
| GET | `exams/analytics/` | → `ExamAnalyticsResponse` | Analytics |

`AdmitCardResponse.card` is `null` when fees are unpaid or attendance is
short, with `blockedReason` set. Render the reason — a blank card is the
single worst thing this screen can do to a student the day before an exam.

`nextExamAt` is an instant, not a pre-rendered `"4 days 06:20:11"`. The
countdown ticks client-side; a server-rendered one is stale on arrival.

### 3.6 Finance — 6 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `finance/overview/` | → `FinanceOverviewResponse` | Overview |
| GET | `finance/payment-options/` | → `PaymentOptionsResponse` | Make Payment |
| POST | `finance/payments/` | `CreatePaymentRequest` → `PaymentIntent` (201) | Make Payment |
| GET | `finance/payments/{id}/` | → `PaymentIntent` | Make Payment (poll) |
| GET | `finance/statement/?termId=` | → `FeeStatementResponse` | Fee Statement |
| GET | `finance/invoices/` | → `InvoicesResponse` | Invoices |
| GET | `finance/installments/` | → `InstallmentsResponse` | Installments |
| GET | `finance/history/?cursor=` | → `PaymentHistoryResponse` | History |

Payment flow, in order:

1. `GET payment-options/` — outstanding, minimum, methods, open invoices.
2. `POST payments/` with a client-generated `idempotencyKey` (UUID, held for
   the whole attempt including retries).
3. Response is `PaymentIntent`. `status: 'REDIRECT_REQUIRED'` → send the
   browser to `redirectUrl`. The gateway owns the next step.
4. On return, poll `GET payments/{id}/` until `SUCCESS` or `FAILED`.
5. Invalidate `['finance']` — overview, invoices and history all move.

Server-side validation the client must surface, not duplicate as truth:
below `minimumPayable`, above `outstanding`, disabled method, missing
idempotency key. The client may pre-validate for a fast red border; the
server decides.

### 3.7 AI — 8 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `ai/overview/` | → `AiOverviewResponse` | Overview |
| GET | `ai/conversations/` | → `Cursored<…>` | Chat |
| GET | `ai/conversations/{id}/` | → `AiConversationResponse` | Chat |
| POST | `ai/conversations/{id}/messages/` | `SendAiMessageRequest` → **SSE** | Chat |
| GET | `ai/study-planner/options/` | → `StudyPlannerOptionsResponse` | Study Planner |
| POST | `ai/study-planner/` | `StudyPlannerRequest` → `StudyPlanResponse` (201) | Study Planner |
| POST | `ai/notes/` | `GenerateNoteRequest` → `GeneratedNoteResponse` (201) | Note Generator |
| GET | `ai/quiz/options/` | → `QuizGeneratorOptionsResponse` | Quiz Generator |
| POST | `ai/quiz/` | `GenerateQuizRequest` → `GeneratedQuizResponse` (201) | Quiz Generator |
| POST | `ai/assignment-helper/` | `AssignmentHelperRequest` → `AssignmentHelperResponse` (201) | Assignment Helper |
| GET | `ai/advisor/` | → `AiAdvisorResponse` | Advisor |
| GET | `ai/recommendations/` | → `RecommendationsResponse` | Recommendations |

Every dropdown on these screens is server-driven via an `…/options/`
endpoint. Course lists and difficulty tiers are data, not frontend constants,
or they drift the moment the catalog changes.

Chat is the only endpoint that is not JSON — see §7.2.

### 3.8 Certificates — 1 screen

| Method | Path | R → |
|---|---|---|
| GET | `certificates/` | → `CertificatesResponse` |
| POST | `certificates/print-orders/` | `PrintOrderRequest` → `PrintOrder` (201) |

`Certificate.downloadUrl` is private and short-lived; `verifyUrl` is a public
page safe to hand to an employer. Two fields because they have two audiences.

### 3.9 Profile — 5 screens

| Method | Path | R → | Screen |
|---|---|---|---|
| GET | `profile/` | → `ProfileResponse` | Personal Info, Academic, Documents, Activity Log |
| PATCH | `profile/` | `UpdateProfileRequest` → `ProfileResponse` | Personal Info |
| POST | `profile/photo/` | multipart → `{ avatarUrl }` | Personal Info |
| POST | `profile/documents/` | multipart → `ProfileDocument` (201) | Documents |
| GET | `profile/security/` | → `SecurityResponse` | Security |
| POST | `profile/security/password/` | `ChangePasswordRequest` → `{ summary, at }` | Security |
| POST | `profile/security/sessions/revoke-others/` | → `{ summary, at }` | Security |

One GET covers all 4 `SUB_NAV` tabs — screen-shaped, like every other module
(§2.1). `ProfileResponse` extends `Me` rather than duplicating its fields, so
the profile page is one request instead of two.

Self-editable via `PATCH`: `phone`, `alternatePhone`, `presentAddress`,
`permanentAddress`, `emergencyContact`. Everything else — name, national ID,
blood group, academic standing — is the registrar's; the server 403s on any
other field, same contract as `PATCH faculty/profile/`.

Security is a separate GET/mutation group because it is a drill-in from the
main page (`My Profile › Security`), not a `SUB_NAV` tab.

---

## 4. What the client sends

Beyond the request bodies above, every request carries:

| Header | When | Value |
|---|---|---|
| `Authorization` | every `/api/student/*` | `Bearer <access>` |
| `Content-Type` | any request with a body | `application/json`, or omitted for multipart so the browser sets the boundary |
| `Accept-Encoding` | every request | browser default (`br, gzip`) |
| `Idempotency-Key` | payments | mirrors the body field; belt and braces |

The client never sends: student id (the JWT has it), role (same), display
strings, computed totals, or anything it read from a previous response and
did not change.

---

## 5. Optimistic UI

### 5.1 The rule

Be optimistic when the outcome is **predictable, cheap to reverse, and
low-stakes if briefly wrong.** Otherwise show a pending state.

Optimism is a lie you tell the user for ~200ms. It is worth telling when
you'd win the bet 99 times out of 100 and losing costs a toast.

### 5.2 Per-mutation policy

| Mutation | Optimistic | Patch | On failure |
|---|---|---|---|
| Create note | **yes** | Prepend with `tmp-` id | Remove, toast |
| Update note | **yes** | Replace in place | Restore snapshot |
| Delete note | **yes** | Remove from list | Re-insert at index |
| Forum reply | **yes** | Append with `isMine: true` | Remove, keep draft text |
| Mark announcement read | **yes** | `read: true`, decrement `unreadCount` | Silent revert, no toast |
| Lecture progress | **yes** | `positionSeconds`, `watched` | Silent — fire-and-forget |
| Drop a course | **yes** | Remove row, recompute credits | Restore, toast the reason |
| Add a course | **no** | — | Seats are contended; 409 is common |
| Submit assignment | **no** | — | Upload has real duration; show progress |
| Quiz attempt | **no** | — | The score is the answer; do not guess it |
| Revaluation request | **partial** | Prepend a `PENDING` row | Remove, toast the field error |
| Semester registration | **no** | — | Advisor approval is a workflow |
| Update profile contact info | **yes** | Merge patch onto `ProfileResponse` | Restore snapshot |
| Change password | **no** | — | A wrong optimistic "changed" is a lockout risk |
| **Any payment** | **never** | — | See below |

### 5.3 Never optimistic: money

Nothing under `finance/payments/` gets an optimistic update. A UI that shows
a payment as succeeded before the gateway confirms it produces a student who
believes their fees are cleared and stops checking. `PENDING` →
`REDIRECT_REQUIRED` → poll → `SUCCESS` is the flow, and every state is real.

### 5.4 The pattern

`useOptimistic` in [`use-api.ts`](../../src/hooks/use-api.ts) returns the
three options a react-query mutation needs. Spread it in:

```ts
const patch = useOptimistic<Paginated<Note>, CreateNoteRequest>(
  ['lms', 'notes'],
  (page, vars) => ({
    ...page,
    count: page.count + 1,
    results: [{ ...vars, id: `tmp-${crypto.randomUUID()}`, updatedAt: new Date().toISOString() }, ...page.results],
  }),
)

const create = usePostData<Note, CreateNoteRequest>('/api/student/lms/notes/', ['lms', 'notes'], patch)
```

Three things it does that hand-rolled versions forget:

1. **`cancelQueries` before reading the snapshot.** An in-flight GET that
   resolves after your patch will overwrite it with pre-mutation data.
2. **Snapshot the whole query, not the row.** Rolling back one field cannot
   undo a reorder or a recomputed count.
3. **`invalidateQueries` in `onSettled`, on success too.** The server owns
   derived fields — `count`, `unreadCount`, `enrolledCredits`, `state`. Your
   patch guessed at them; the refetch corrects the guess.

**Temporary ids must be visibly temporary.** Prefix with `tmp-` and disable
row actions while `id.startsWith('tmp-')`. A delete fired against a `tmp-`
id 404s, and the rollback then removes the wrong row.

### 5.5 Verifying it

This is the reason the mock server exists rather than a fixture file:

```
POST http://localhost:8787/api/student/lms/notes/?_fail=500   # rollback path
POST http://localhost:8787/api/student/lms/notes/?_delay=3000 # watch the patch land
```

An optimistic update you have never seen roll back is not implemented, it is
assumed. `bun run mock:test` asserts both knobs work.

---

## 6. Write endpoints in detail

### 6.1 Validation is the server's

Client-side checks exist for latency, not for truth. Every `400` body is
field-keyed, so:

```ts
catch (e) {
  if (e instanceof ApiError && e.status === 400) {
    setFieldErrors(e.body as ApiErrorBody)  // { amount: ["Cannot exceed…"] }
  }
}
```

### 6.2 Assignment submission — multipart

`POST lms/assignments/{id}/submissions/` is `multipart/form-data`, not JSON.
Files do not base64 into a JSON body without a 33% size penalty and a lost
progress bar.

```ts
const form = new FormData()
files.forEach((f) => form.append('files', f))
form.append('comment', comment)
form.append('integrityAgreed', String(agreed))
// Do NOT set Content-Type — the browser must add the multipart boundary.
```

`SubmitAssignmentRequest` types the form model, not a JSON body. Constraints
come from `AssignmentDetailResponse`: `maxAttachments`, `maxAttachmentBytes`,
`acceptedMimeTypes`. Enforce them client-side for the fast rejection; the
server enforces them for real.

`integrityAgreed: false` → 400. The declaration is a legal artifact, so it is
checked server-side and stored with the submission, not just gated in the UI.

### 6.3 Announcements read-receipts

`POST lms/announcements/{id}/read/` → 204, no body. Fire it on view, patch
`read` and `unreadCount` optimistically, and never surface a failure — a
missed read-receipt is invisible, a toast about one is noise.

### 6.4 Quizzes: practice ships the key, graded never does

`PracticeQuizResponse.questions[].correctOptionId` is populated, so practice
grades instantly and works offline. **A graded quiz must send `null`.** The
answer key in a graded payload is one devtools tab away from being the whole
exam. `POST …/attempts/` returns `perQuestion[]` with the key *after*
submission — that is where it becomes safe.

---

## 7. Non-JSON transports

### 7.1 Binary downloads

`pdfUrl`, `downloadUrl`, `videoUrl`, `Attachment.url` are pre-signed and
short-lived. Navigate or `<a download>` to them; do not fetch them through
`apiFetch`, which assumes JSON. Do not persist them in app state — they
expire.

### 7.2 AI chat: SSE

`POST ai/conversations/{id}/messages/` responds `text/event-stream`.
`apiFetch` cannot be used — it calls `.json()` on the body.

```ts
const res = await fetch(`${BASE}/api/student/ai/conversations/${id}/messages/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ text }),
})

const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
for (let acc = ''; ; ) {
  const { value, done } = await reader.read()
  if (done) break
  acc += value
  const frames = acc.split('\n\n')
  acc = frames.pop() ?? ''                       // keep the partial frame
  for (const f of frames) {
    const e = JSON.parse(f.replace(/^data: /, '')) as AiStreamEvent
    if (e.type === 'delta') appendToPendingMessage(e.text)
    if (e.type === 'error') showRetry(e.message)
  }
}
```

The user's own message is appended optimistically with a real `id`; the
assistant's reply is appended as `pending: true` and filled by deltas. This
is the one place a "temporary" row is expected to stay visible while it
resolves.

`EventSource` is not an option — it cannot POST a body and cannot set an
`Authorization` header.

---

## 8. Mock server

See **[general.md §8](general.md#8-mock-server)** — same server, same knobs,
same `bun run mock`. Student state that persists until restart: notes, forum
replies, revaluation requests, registration, read-receipts and payments.

---

## 9. How the migration went

**Every student screen is on the real fetch path.** `src/lib/fixtures.ts` no
longer exists. The recipe below is what was applied, kept because it is the
shortest description of how the wire contract differs from the fixtures it
replaced:

1. **Swap the hook** — `useFixture(key, {…})` → `useGetData<T>(path, key)`,
   with `T` from `@/types`. One line per hook, in `api.ts` only.
2. **Move formatting to the edge** — the wire sends `dueAt`, not
   `'Oct 24, 2023'`. Use `date()` / `relative()` / `money()` from
   `lib/format.ts` in the component.
3. **Follow the nesting** — `c.name` became `c.course.title`, `c.teacher`
   became `c.instructorName`.
4. **Nulls, not sentinels** — `grade === 'N/A'` became `grade === null`.
5. **Pull the assistant out** — the `assistant` prop became
   `<ConnectedAssistant context="…" />`.
6. `bunx tsc -b` — the types catch every site you missed.

Two things it changed beyond the data layer, both worth knowing:

- **Generator screens no longer render content on mount.** Study Planner,
  Note Generator, Quiz Generator and Assignment Helper show their form and an
  empty state until the student presses Generate. Auto-running a model call
  on navigation would bill for output nobody asked for.
- **Fixture copy that was never per-student is now a constant in the
  component** — the certificates print blurb, the "Ready to Prepare?" CTA. It
  was never data, and putting it on the wire made it look like it was.

---

## 10. For the backend developer

Decisions that need confirming or that constrain the Django side:

1. **`role` claim on the access token** — required. Without it the app cannot
   pick a shell. Also useful: `full_name`, `email`, `department`.
2. **`COERCE_DECIMAL_TO_STRING`** — leave at the default `True`. `Money` is a
   decimal string, and this contract depends on it.
3. **All datetimes UTC with `Z`.** `USE_TZ = True`, and DRF's default ISO
   renderer.
4. **Payment idempotency** — `idempotencyKey` must be stored and enforced
   server-side. The client sends one per attempt; a replay must return the
   original intent, not charge again.
5. **Graded quizzes must not serialise `correctOptionId`.** Practice quizzes
   may. Two serializers, not one with a flag someone will get backwards.
6. **Admit card gating** — who decides `blockedReason`? Finance, attendance,
   or both, and in what precedence?
7. **The `Tone` fields** (`Metric.tone`, `notice.tone`, bucket tones) encode
   institutional thresholds. Confirm those thresholds live in Django settings
   rather than being hardcoded in serializers.
8. **Pagination defaults** — `PageNumberPagination` with `page_size=20`,
   `max_page_size=100`, `page_size` overridable by query param.
9. **Rate limits on `/ai/*`** — needed, and they must return 429 with a
   retry window so the UI can disable the trigger rather than spin.
