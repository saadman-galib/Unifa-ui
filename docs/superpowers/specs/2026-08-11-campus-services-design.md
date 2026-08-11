# Campus Services (Library, Student Services, Transport, Hostel) — design

**Date:** 2026-08-11
**Status:** approved (user: "fix those by all the screens i provide on figma file")

## Why

Continuation of the 2026-08-11 My Profile work. Of the 42 new Figma frames
found that day, this covers the next 4 feature areas — the "campus services"
cluster the user named directly (`/library`, `/hostel`, `/transport`) plus
Student Services, its direct sibling in the sidebar. Digital ID, Settings,
Communication, and the new Health module remain for later phases.

## Source frames (16 of 16 viewed; see note on 5)

| Domain | Frames viewed | Frames inferred from pattern |
|---|---|---|
| Library | `11:3488` Dashboard, `11:2870` Request Desk, `11:3066` History & Fines, `11:3309` My Borrowed Books | — |
| Student Services | `11:819` Dashboard (empty shell — title/subtitle only), `11:2` New Request, `11:1502` Request Details, `11:2326` Request History | — |
| Transport | `11:196` Dashboard, `11:2612` Request Desk | `11:1217` Payment History, `11:1925` Route Details |
| Hostel | `11:446` Dashboard | `11:2023` Service Requests, `11:914` Fee Ledger, `11:1623` Room Details |

Figma's MCP tool hit its Starter-plan rate limit mid-session. **5 frames
(Transport Payment History/Route Details, Hostel Service Requests/Fee
Ledger/Room Details) were never screenshotted** — built from the pattern
established by their siblings instead:

- Fee/payment ledgers: identical shape to `PaymentHistory`
  (`src/features/finance/pages/payment-history.tsx`, already in the app) and
  to Library's own History & Fines frame.
- Hostel Service Requests: the Hostel Dashboard's "Quick Links" tile
  (Leave Request, Visitor Request, Complaint, Gate Pass) names the request
  types directly — same shape as the Transport/Student-Services request
  desks.
- Transport Route Details: an expanded version of the "Route & Stops"
  card already fully specified on the Transport Dashboard frame.
- Room Details: an expanded version of the "My Hostel Information" card
  already fully specified on the Hostel Dashboard frame.

**Flag this explicitly to the user** once built — these 5 should get a
visual diff against Figma once the rate limit clears, same as any
inference-built screen.

## The shared shape: one Request type, three domains

Student Services' New Request frame, Transport's Request & Change Desk, and
Hostel's Quick Links (Leave/Visitor/Complaint/Gate Pass) are the same
concept wearing three different category lists: a category, a priority, a
subject, a description, optional attachments, and a status that moves
`SUBMITTED → IN_PROGRESS → COMPLETED/CLOSED`. One `ServiceRequest` type and
one `CreateServiceRequestRequest` cover all three — each domain gets its own
scoped list/create endpoint, not its own type.

Library does **not** use this shape — it is catalog/loan-centric
(book, ISBN, due date, fine), not ticket-centric, and forcing it into
`ServiceRequest` would make neither shape honest.

Ledgers (Transport payments, Hostel fees) reuse the existing `DataTable`
pattern from `payment-history.tsx` rather than inventing a fourth table
component.

## Routes (16 total, all get a `SCREENS` entry — every one has a Figma node)

| Route | Node | Content |
|---|---|---|
| `/student/library` | `11:3488` | Catalog stats + searchable catalog |
| `/student/library/borrowed` | `11:3309` | Active loans, renew |
| `/student/library/history` | `11:3066` | Full history + fines, pay fines |
| `/student/library/request` | `11:2870` | Book acquisition + general feedback forms |
| `/student/services` | `11:819` | Request counts + recent requests + New Request CTA (frame was an empty shell; built the natural dashboard the sidebar item implies) |
| `/student/services/new` | `11:2` | Submit a new request |
| `/student/services/history` | `11:2326` | Full filterable request history |
| `/student/services/:id` | `11:1502` | Request detail |
| `/student/transport` | `11:196` | Route, fee, attendance, vehicle detail |
| `/student/transport/request` | `11:2612` | Pass/route-change/cancel/report desk |
| `/student/transport/payments` | `11:1217` | Payment ledger (inferred) |
| `/student/transport/route` | `11:1925` | Full stop-by-stop route (inferred; no live GPS — see below) |
| `/student/hostel` | `11:446` | Room, fee, roommates, notices, quick links |
| `/student/hostel/request` | `11:2023` | Leave/visitor/complaint/gate-pass desk (inferred) |
| `/student/hostel/ledger` | `11:914` | Hostel + mess fee ledger (inferred) |
| `/student/hostel/room` | `11:1623` | Expanded room/roommate/warden detail (inferred) |

`SUB_NAV` gets a 4-pill entry per domain (matching every other module).
`nav-config.ts`'s Library/Student Services/Transport/Hostel entries drop
`undesigned: true`. All 16 routes move out of `EXTRA_ROUTES` (router.tsx)
into `SCREENS` (routes.ts), since every one now has a Figma node.

## Explicitly out of scope

- **Live GPS on Route Details.** The frame name says "Live GPS"; a mock app
  has no vehicle to track. Ships a static stop-by-stop timeline instead —
  the same data the Dashboard's Route & Stops card already has, just full
  width. A real map integration is a separate, much larger piece of work.
- **File attachments on service requests.** The New Request frame shows one
  already-uploaded file. Supporting upload would mean re-deriving the
  multipart pattern from `assignment-submission.tsx` for a field that isn't
  core to the request lifecycle. Requests submit without attachments for
  now; add multipart the same way Documents did, if asked.
- **Digital ID, Settings, Communication, Health.** Separate phases, per the
  8-area map from the My Profile spec.

## Files

- `src/types/student.ts` — `ServiceRequest`/`CreateServiceRequestRequest`
  (shared) + Library/Transport/Hostel-specific types
- `mock/data.ts`, `mock/server.ts` — sample data + ~20 endpoints across 4
  domains
- `src/features/{library,services,transport,hostel}/api.ts` + `pages/*.tsx`
  (4 pages each, 16 total)
- `src/app/routes.ts`, `src/app/screens.ts`, `src/app/router.tsx`,
  `src/layouts/nav-config.ts` — wiring
- `docs/api/student.md`, `docs/screen-inventory.md` — new sections, moved
  out of "not designed"
