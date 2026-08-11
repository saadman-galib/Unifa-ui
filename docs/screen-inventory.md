# Screen Inventory

Every top-level frame in the Figma file, mapped to a route. **93 frames → 83 buildable screens**, plus 1 shared component and 9 superseded iterations.

> **2026-08-11:** The file has since grown to 135 top-level frames (`get_metadata`
> recount). 42 new frames (node prefix `11:*`) span 8 feature areas — Profile,
> Digital ID, Settings, Communication, Library, Student Services, Transport,
> Hostel — plus a wholly new "Health" module not yet in `nav-config.ts` at
> all. **My Profile** (5 screens) and the **campus services cluster** —
> Library, Student Services, Transport, Hostel (16 screens) — are built; see
> [superpowers/specs/2026-08-11-student-profile-design.md](superpowers/specs/2026-08-11-student-profile-design.md)
> and [superpowers/specs/2026-08-11-campus-services-design.md](superpowers/specs/2026-08-11-campus-services-design.md).
> Transport Payments/Route and all 3 non-Dashboard Hostel screens were built
> **without a Figma screenshot** (MCP rate limit) — pattern-inferred from
> sibling frames, flagged individually below, worth a visual diff once
> available. Digital ID, Settings, Communication, and Health remain —
> future phases.

- **File key:** `H6SDkbXPzmF8l2DkDQmvB9`
- **Open a frame:** `https://www.figma.com/design/H6SDkbXPzmF8l2DkDQmvB9/uninexus?node-id=<node-id with ':' → '-'>`
- **Pull design context:** `get_design_context(fileKey, nodeId)` — always read [design.md](design.md) first and build from its tokens, not from the returned literals.

Status: `canonical` = build this · `superseded` = a later iteration replaces it, do not build · `component` = shared, not a route.

---

## Student — 60 screens

Route prefix `/student`. Sidebar: Dashboard, My Profile, Academic, Learning (LMS), Attendance, Examination, Finance, Library, Student Services, Clubs, Transport, Hostel, AI Academic Assistant, Certificates, Digital ID.

### Shell & dashboard

| Node | Frame | Route | Status |
|---|---|---|---|
| `9:6820` | Student Dashboard — Desktop | `/student` | canonical |
| `9:7281` | Student Dashboard (390px) | `/student` @ mobile | canonical |
| `6:7179` | Student Sidebar Panel | — | component |

### Academic — 11

| Node | Frame | Route | Status |
|---|---|---|---|
| `6:11399` | My Courses | `/student/academic/courses` | canonical |
| `6:10774` | Course Registration | `/student/academic/registration/courses` | canonical |
| `6:11107` | Semester Registration | `/student/academic/registration/semester` | canonical |
| `6:10404` | Drop/Add Course | `/student/academic/registration/drop-add` | canonical |
| `6:10057` | Curriculum | `/student/academic/curriculum` | canonical |
| `6:9702` | Degree Progress | `/student/academic/degree-progress` | canonical |
| `6:8940` | Credit Progress | `/student/academic/credits` | canonical |
| `6:8554` | Class Routine | `/student/academic/routine` | canonical |
| `6:9314` | Academic Calendar | `/student/academic/calendar` | canonical |
| `6:8199` | Classroom Information | `/student/academic/classrooms` | canonical |
| `6:7770` | Faculty Directory (2-col grid) | `/student/academic/faculty` | canonical |

### Learning / LMS — 19

| Node | Frame | Route | Status |
|---|---|---|---|
| `6:2` | LMS Overview | `/student/lms` | canonical |
| `6:439` | My Courses | `/student/lms/courses` | canonical |
| `6:2191` | Course Materials | `/student/lms/courses/:id/materials` | canonical |
| `6:1451` | Video Lectures | `/student/lms/courses/:id/lectures` | canonical |
| `6:1780` | Live Classes | `/student/lms/live` | canonical |
| `6:2573` | Recorded Classes | `/student/lms/recordings` | canonical |
| `6:2928` | Assignments | `/student/lms/assignments` | canonical |
| `6:3292` | Assignment Submission | `/student/lms/assignments/:id/submit` | canonical |
| `6:3564` | Quizzes | `/student/lms/quizzes` | canonical |
| `6:4278` | Practice Quiz | `/student/lms/quizzes/:id/practice` | canonical |
| `6:7427` | Gradebook | `/student/lms/gradebook` | canonical |
| `6:3933` | Discussion Forum | `/student/lms/forum` | canonical |
| `6:4677` | Notes | `/student/lms/notes` | canonical |
| `6:5065` | Learning Progress | `/student/lms/progress` | canonical |
| `6:6146` | Learning Analytics | `/student/lms/analytics` | canonical |
| `6:6849` | Course Announcements | `/student/lms/announcements` | canonical |
| `6:5838` | Downloads | `/student/lms/downloads` | canonical |
| `6:5438` | Certificates | `/student/certificates` | canonical |
| `6:1047` | Certificates & Achievements | `/student/certificates` | superseded by `6:5438` |

### Attendance — 5

| Node | Frame | Route | Status |
|---|---|---|---|
| `1:15772` | Attendance Overview (3×2 metrics) | `/student/attendance` | canonical |
| `1:15435` | Daily Attendance | `/student/attendance/daily` | canonical |
| `1:14603` | Course Attendance | `/student/attendance/by-course` | canonical |
| `1:15013` | Attendance History | `/student/attendance/history` | canonical |
| `1:14266` | Attendance Analytics | `/student/attendance/analytics` | canonical |

### Examination — 9

| Node | Frame | Route | Status |
|---|---|---|---|
| `1:8461` | Examination Overview | `/student/exams` | canonical |
| `1:9040` | My Exam Schedule | `/student/exams/schedule` | canonical |
| `1:10924` | Upcoming Exams | `/student/exams/upcoming` | canonical |
| `1:10550` | Admit Card | `/student/exams/admit-card` | canonical |
| `1:12105` | Exam Results | `/student/exams/results` | canonical |
| `1:11742` | Grade Report | `/student/exams/grade-report` | canonical |
| `1:13158` | Exam Revaluation | `/student/exams/revaluation` | canonical |
| `1:13501` | Exam Analytics | `/student/exams/analytics` | canonical |
| `1:13906` | Exam Attendance Sheet | `/student/exams/attendance` | canonical |

### Finance — 6

| Node | Frame | Route | Status |
|---|---|---|---|
| `1:9705` | Finance Overview | `/student/finance` | canonical |
| `1:10138` | Fee Statement | `/student/finance/statement` | canonical |
| `1:9415` | Make Payment | `/student/finance/pay` | canonical |
| `1:11319` | Payment History | `/student/finance/history` | canonical |
| `1:12541` | Invoices | `/student/finance/invoices` | canonical |
| `1:12857` | Installment Plan | `/student/finance/installments` | canonical |

### AI Academic Assistant — 8

| Node | Frame | Route | Status |
|---|---|---|---|
| `1:5657` | AI Assistant Overview | `/student/ai` | canonical |
| `1:6099` | AI Chat Workspace | `/student/ai/chat` | canonical |
| `1:6424` | AI Study Planner | `/student/ai/study-planner` | canonical |
| `1:6831` | AI Note Generator | `/student/ai/notes` | canonical |
| `1:7161` | AI Quiz Generator | `/student/ai/quiz` | canonical |
| `1:7430` | AI Assignment Helper | `/student/ai/assignment-helper` | canonical |
| `1:7728` | AI Academic Advisor | `/student/ai/advisor` | canonical |
| `1:8101` | AI Course Recommendation | `/student/ai/recommendations` | canonical |

### My Profile — 5

Route prefix `/student/profile`. `SUB_NAV` pills: Personal Info, Academic, Documents, Activity Log. Security is a drill-in from the main page, not a pill.

| Node | Frame | Route | Status |
|---|---|---|---|
| `11:4256` | My Profile Dashboard | `/student/profile` | canonical |
| `11:4476` | Academic Information | `/student/profile/academic` | canonical |
| `11:3993` | Documents Manager | `/student/profile/documents` | canonical |
| `11:4782` | Activity Log | `/student/profile/activity` | canonical |
| `11:5223` | Security Panel | `/student/profile/security` | canonical |
| `11:3724` | Edit Personal Information | — | folded into `/student/profile` (edit mode) |
| `11:3904` | Profile Photo Studio | — | folded into `/student/profile` (photo upload) |
| `11:4395` | Upload Document | — | folded into `/student/profile/documents` (upload) |
| `11:5090` | Verification Desk | — | mislabeled — actually Digital ID content, deferred to that nav item |

### Library — 4

Route prefix `/student/library`. `SUB_NAV` pills: Dashboard, My Borrowed Books, History & Fines, Requests.

| Node | Frame | Route | Status |
|---|---|---|---|
| `11:3488` | Library Dashboard | `/student/library` | canonical |
| `11:3309` | My Borrowed Books | `/student/library/borrowed` | canonical |
| `11:3066` | Library History & Fines | `/student/library/history` | canonical |
| `11:2870` | Library Request Desk | `/student/library/request` | canonical |

### Student Services — 4

Route prefix `/student/services`. `SUB_NAV` pills: Dashboard, New Request, History. Request Details is a drill-in from a request row, not a pill.

| Node | Frame | Route | Status |
|---|---|---|---|
| `11:819` | Student Services Dashboard | `/student/services` | canonical — frame itself was an empty shell (title/subtitle only); built the counts+recent-requests dashboard the sidebar item implies |
| `11:2` | New Service Request Desk | `/student/services/new` | canonical |
| `11:2326` | Request History & Audit | `/student/services/history` | canonical |
| `11:1502` | Request Details & Progress | `/student/services/:id` | canonical |

### Transport — 4

Route prefix `/student/transport`. `SUB_NAV` pills: Dashboard, Request, Payments, Route.

| Node | Frame | Route | Status |
|---|---|---|---|
| `11:196` | Transport Dashboard | `/student/transport` | canonical |
| `11:2612` | Transport Request Desk | `/student/transport/request` | canonical |
| `11:1217` | Transport Payment History | `/student/transport/payments` | canonical — **built without a screenshot**, Figma MCP hit its rate limit; inferred from the `PaymentHistory` ledger pattern already in the app. Diff against Figma once available. |
| `11:1925` | Route Details & Live GPS | `/student/transport/route` | canonical — **built without a screenshot**, same rate limit. No live map: a static stop-by-stop timeline, since the mock has no vehicle to track. |

### Hostel — 4

Route prefix `/student/hostel`. `SUB_NAV` pills: Dashboard, Request, Fee Ledger, Room Details.

| Node | Frame | Route | Status |
|---|---|---|---|
| `11:446` | Hostel Dashboard | `/student/hostel` | canonical |
| `11:2023` | Hostel Service Requests | `/student/hostel/request` | canonical — **built without a screenshot**; the Dashboard's own "Quick Links" tile names the request types (Leave/Visitor/Complaint/Gate Pass), which is what the form uses. |
| `11:914` | Hostel Fee & Payment Ledger | `/student/hostel/ledger` | canonical — **built without a screenshot**; same ledger pattern as Transport Payments. |
| `11:1623` | Room Details Workspace | `/student/hostel/room` | canonical — **built without a screenshot**; expands the Dashboard's own "My Hostel Information" + "Roommates" cards, same GET. |

### Not designed / not yet built

Sidebar links with **no frame in the file**: Clubs, Digital ID. See [prd.md](prd.md) §6.

**Frames exist but not yet built** (2026-08-11 batch, 17 of 42 frames, future phases): Digital ID (real content is `11:5090` + `11:4974`), Settings (`11:5888` + privacy/notification/device/audit sub-frames), Communication (`11:6059` + 4 more). See the spec note at the top of this document.

**A wholly new module, not in `nav-config.ts` at all:** Health — `11:7728` Health Dashboard, `11:7860` Emergency & Health Services, `11:8078` Medical Certificate Management, `11:8305` Student Health Records, `11:8578` Health Analytics & Reports.

---

## Faculty — 16 frames, 14 screens

Route prefix `/faculty`. Sidebar: Dashboard, My Profile, Academic, Courses, Examination, Attendance, Settings, Support.

| Node | Frame | Route | Status |
|---|---|---|---|
| `1:2` | Dashboard (3×2 metrics) | `/faculty` | canonical |
| `1:868` | Profile (hero layout) | `/faculty/profile` | canonical |
| `1:1147` | Academic Overview | `/faculty/academic` | canonical |
| `1:3640` | Courses Management | `/faculty/courses` | canonical |
| `1:433` | My Assigned Courses | `/faculty/courses/assigned` | canonical |
| `1:1841` | Assignments Overview | `/faculty/assignments` | canonical |
| `1:4053` | Assignments Review | `/faculty/assignments/:id/review` | canonical |
| `1:2169` | Grade Book Management | `/faculty/gradebook` | canonical |
| `1:3320` | Examination Management | `/faculty/exams` | canonical |
| `1:2938` | Attendance Management (final hi-fi) | `/faculty/attendance` | canonical |
| `1:2506` | Attendance Management (vertical) | — | superseded by `1:2938` |
| `1:4483` | Attendance Management | — | superseded by `1:2938` |
| `1:5077` | Research Portfolio | `/faculty/research` | canonical |
| `1:1490` | Research & Grant Management | `/faculty/research/grants` | canonical |
| `1:4777` | Personal Finance | `/faculty/finance` | canonical |
| `1:5381` | Library Resources | `/faculty/library` | canonical |

---

## Admin / ERP — 16 frames, 10 screens

Route prefix `/admin`. Dark shell. Sidebar: Dashboard, User Management, Academic, Finance, System Health + Quick Actions, Settings, Support.

This persona has the **highest duplicate density** — six frames are superseded. Confirm the canonical picks with the designer before Phase 4.

| Node | Frame | Route | Status |
|---|---|---|---|
| `7:15548` | Executive Dashboard (high fidelity) | `/admin` | canonical |
| `7:17588` | Admin Dashboard | — | superseded by `7:15548` |
| `7:16795` | Admin Master Workspace | — | superseded by `7:15548` |
| `7:17990` | User Management | `/admin/users` | canonical |
| `7:13534` | User Management (inner UI) | — | superseded by `7:17990` |
| `7:15889` | User Management & Security Profile | `/admin/users/:id` | canonical |
| `7:13082` | Academic Management | `/admin/academic` | canonical |
| `7:12631` | Admission Management | `/admin/admissions` | canonical |
| `7:12274` | Application Review Workspace | `/admin/admissions/:id` | canonical |
| `7:11851` | Finance & Accounts Control Center | `/admin/finance` | canonical |
| `7:17176` | Examination Management Hub | `/admin/exams` | canonical |
| `7:14716` | Examination Management | — | superseded by `7:17176` |
| `7:16290` | Exam Scheduling & Timetable Matrix | `/admin/exams/schedule` | canonical |
| `7:15153` | Exam Schedule & Matrix | — | superseded by `7:16290` |
| `7:14290` | Marks Entry & Results Workspace | `/admin/exams/marks` | canonical |
| `7:13974` | Marks Entry & Result Publishing | — | superseded by `7:14290` |

### Not designed

Sidebar links with no frame: System Health, Settings, Support. See [prd.md](prd.md) §6.

---

## Counts

Original batch (verified against the Figma metadata dump at the time: 93
top-level frames on page `0:1` — `1:*` 44, `6:*` 31, `7:*` 16, `9:*` 2):

| Persona | Frames | Canonical | Superseded |
|---|---|---|---|
| Student | 61 | 59 + 1 component | 1 |
| Faculty | 16 | 14 | 2 |
| Admin/ERP | 16 | 10 | 6 |
| **Total** | **93** | **83 + 1** | **9** |

**2026-08-11 recount:** 135 top-level frames (`1:*` 44, `6:*` 31, `7:*` 16,
`9:*` 2, `11:*` 42). Of the 42 new `11:*` frames: 9 accounted for by My
Profile (5 routed, 3 folded into those routes as edit/upload modals, 1
deferred to Digital ID); 16 routed by the campus services cluster (Library,
Student Services, Transport, Hostel — all 1:1 with their frames, no folding).
17 remain tracked but not yet routed: Digital ID, Settings, Communication,
Health. Re-run
`get_metadata(fileKey, "0:1")` and recount if frames are added again.
