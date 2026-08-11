# Student "My Profile" — design

**Date:** 2026-08-11
**Status:** approved

## Why

The Figma file grew from 93 to 135 top-level frames since `docs/screen-inventory.md`
was last verified. 42 new frames (node prefix `11:*`) exist across 8 feature
areas plus a wholly new "Health" module, none tracked in `routes.ts` /
`screens.ts` / the inventory doc. This spec covers the first area: **My
Profile** (student), the most foundational of the 8 — faculty and admin
already have profile pages to mirror.

## Source frames

9 new frames were tagged "My Profile" in Figma (file `H6SDkbXPzmF8l2DkDQmvB9`):
`11:4256` My Profile Dashboard, `11:3724` Edit Personal Information, `11:3904`
Profile Photo Studio, `11:3993` Documents Manager, `11:4395` Upload Document,
`11:4476` Academic Information, `11:4782` Activity Log, `11:5090`
Verification Desk, `11:5223` Security Panel.

The frames are inconsistent with each other (different sidebars, different
tab groupings per frame) — expected for an early design pass. Reconciled
structure, not literal frame-by-frame:

- `My Profile Dashboard` is the container; its own tab strip is *Personal
  Information · Academic Information · Documents · Activity Log*. The 4
  correspondingly-named frames are that container's tab content.
- `Security Panel` has its own breadcrumb (`My Profile › Security`) — a
  drill-in, not a tab.
- `Photo Studio` and `Upload Document` are short, modal-shaped frames —
  actions launched from Personal Info / Documents.
- `Verification Desk` is actually Digital ID content (ID card, "UniGPT
  Verified" badge) mislabeled into this batch. **Deferred** — belongs to the
  separate `/student/digital-id` nav item, a later phase.

## Routing

Matches the existing module pattern used by Academic/LMS/Attendance/Exams/
Finance/AI: `SUB_NAV` pill-tabs rendered by `app-shell.tsx`, not the unused
generic `Tabs` UI primitive.

| Route | Figma node | Content |
|---|---|---|
| `/student/profile` | `11:4256` | Personal info (view + edit modal) |
| `/student/profile/academic` | `11:4476` | Academic standing summary — program/advisor/dates only, links out to the already-built Degree Progress / Credit Progress pages for GPA/credit numbers rather than recomputing them |
| `/student/profile/documents` | `11:3993` | Document grid + upload modal |
| `/student/profile/activity` | `11:4782` | Audit trail |
| `/student/profile/security` | `11:5223` | Password change, sessions — reached via a button on the main page, not a `SUB_NAV` pill |

`SUB_NAV['/student/profile']` gets the first 4 as pills. `nav-config.ts`'s
`My Profile` entry drops `undesigned: true`. All 5 routes move into `SCREENS`
in `routes.ts` (they now have real Figma nodes); the current
`/student/profile` entry in `EXTRA_ROUTES` (router.tsx) is removed.

## Data

One GET per screen, matching the rest of the app. `GET /api/me/` already
exists (`src/types/common.ts` `Me` type) but nothing consumes it yet — fold
it into a new `ProfileResponse` (`Me & { bloodGroup, dateOfBirth, address,
emergencyContact, academic, documents[], activity[] }`) so the page is one
round trip, same shape as `FacultyProfile`.

Self-editable fields mirror the faculty profile pattern: contact/address/
emergency-contact are user-editable via `PATCH`; identity fields (name,
national ID, blood group) are registrar-locked read-only.

```
GET   /api/student/profile/                    -> ProfileResponse
PATCH /api/student/profile/                     -> ProfileResponse (self-editable subset)
POST  /api/student/profile/photo/                -> { avatarUrl } (multipart)
POST  /api/student/profile/documents/            -> ProfileDocument (multipart)
GET   /api/student/profile/security/            -> SecurityResponse
POST  /api/student/profile/security/password/    -> { summary, at }
POST  /api/student/profile/security/sessions/revoke-others/ -> { summary, at }
```

## Files

- `src/types/student.ts` — new Profile section (types above)
- `mock/data.ts`, `mock/server.ts` — sample data + 7 endpoints
- `src/features/profile/api.ts` — TanStack Query hooks
- `src/features/profile/pages/{personal-info,academic-info,documents,activity-log,security}.tsx`
- `src/app/routes.ts`, `src/app/screens.ts`, `src/app/router.tsx`,
  `src/layouts/nav-config.ts` — wiring
- `docs/api/student.md` — new §Profile section
- `docs/screen-inventory.md` — move these 5 frames from "Not designed" to
  canonical; the other 33 new frames (Digital ID, Settings, Communication,
  Library, Student Services, Transport, Hostel, Health) stay flagged, future
  phases

## Explicitly out of scope

- Verification Desk / Digital ID (separate nav item)
- 2FA setup/management beyond a read-only status badge (screenshot shows
  "Edit"/"Manage" affordances with no defined destination — real 2FA flow is
  a security feature that needs its own spec, not a guess)
- The other 7 feature areas from the 42-new-frame batch (Settings,
  Communication, Library, Student Services, Transport, Hostel) and the Health
  module — separate phases, per user's explicit "one area at a time" choice
