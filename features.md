# Khatema — Feature List

> All features listed here are **fully implemented** and available in the codebase.

---

## Authentication

| Feature | Details |
|---------|---------|
| Email & password register | Validation: min 8 chars, uppercase, number, special char |
| Email & password login | JWT access (15 min) + refresh (7 days) |
| Google OAuth 2.0 | Sign in / sign up via Google account |
| Token refresh | Silent rotation via httpOnly cookie |
| Logout | Session revocation on server |
| Session tracking | Device-level session model in DB |
| OTP flow (backend) | Redis-based OTP (5 min TTL) — no frontend UI yet |

---

## Khatma Management

| Feature | Details |
|---------|---------|
| Create khatma | Title, description, type (Collective/Individual), visibility, settings |
| Individual khatma | Always private; allowRepeat and requireApproval locked off |
| Collective khatma | Up to 30 participants; public or private |
| Edit khatma | Owner can update title and description |
| Delete khatma | Owner soft-deletes; data retained in DB |
| Khatma settings | `allowRepeat`, `requireApproval`, `isContinuous`, `maxMembers`, `visibility` |
| Continuous mode | Auto-resets all parts on completion, increments iteration counter |
| Subscription limits | User sets max active khatmas per type (1–5); enforced on create & join |
| Status tracking | ACTIVE → COMPLETED (automatic when all parts done) |
| Auto-create parts | 30 Quran parts generated automatically on khatma creation |

---

## Quran Parts & Reservations

| Feature | Details |
|---------|---------|
| 30-part grid | Visual 10-column responsive grid |
| Reserve a part | Click available part → confirmation modal → reserved |
| Mark complete | Click your reserved part → confirm → completed |
| Admin unreserve | Khatma owner can cancel any member's reservation |
| Distributed lock | Redis lock (5 s TTL) prevents race-condition double-booking |
| Duplicate prevention | User can't reserve two parts at once (unless `allowRepeat` on) |
| Auto-completion check | Khatma completes automatically when all 30 parts are done |
| Part status colors | Green = available, Amber = reserved, Gray = completed |

---

## Participants & Group Management

| Feature | Details |
|---------|---------|
| Join public khatma | Direct join (no approval needed by default) |
| Join with approval | `requireApproval=true` → status PENDING until owner approves |
| Approve join request | Owner/admin PATCH endpoint |
| Leave khatma | Voluntarily leave; active reservations auto-released |
| Invite via link | Generate shareable token link (48 h expiry) |
| Invite by email | Send invite email with custom name |
| Join via invite token | Bypasses `requireApproval` |
| Participant roles | OWNER, ADMIN, MEMBER |
| Participant status | ACTIVE, PENDING, LEFT, KICKED |

---

## User Profile

| Feature | Details |
|---------|---------|
| Profile page | Avatar (Google or initials), display name, email |
| Stats | Total khatmas joined, parts completed, khatmas completed |
| Active reservations | List with part number, khatma title, reserved date |
| Completed parts | List with part number, khatma title, start + end dates |
| Completed khatmas | List with title, start date, completion date |
| Khatma limits | Dropdowns (1–5) for collective and individual limits with save |
| Logout | Button clears session on server + client store |

---

## Real-Time Updates (WebSocket)

| Feature | Details |
|---------|---------|
| Socket.IO gateway | JWT-authenticated connection |
| Khatma rooms | Users auto-join the room for the khatma they're viewing |
| `part.reserved` event | Broadcast to room when a part is reserved |
| `part.completed` event | Broadcast to room when a part is completed |
| `part.unreserved` event | Broadcast when admin releases a reservation |
| `khatma.completed` event | Broadcast when all 30 parts are done |
| `khatma.restarted` event | Broadcast when continuous khatma resets |
| Frontend hook | `useRealtime(khatmaId)` — React Query invalidation + toast |

---

## Notifications

| Feature | Details |
|---------|---------|
| Notification types | PART_RESERVED, PART_COMPLETED, KHATMA_COMPLETED, KHATMA_JOINED, INVITATION_SENT, JOIN_APPROVED, JOIN_REJECTED, DEADLINE_REMINDER, PART_RELEASED |
| Create notification | Triggered by khatma events via EventEmitter |
| List notifications | Paginated (20/page) |
| Mark as read | Single or bulk (mark all read) |
| Unread count | Available on profile and notification list |

---

## Email

| Feature | Details |
|---------|---------|
| Khatma invite email | Sent when owner invites by email; includes khatma title + CTA button |
| SMTP via Nodemailer | Gmail (or any SMTP) with env-configured credentials |
| Fallback logging | Logs email to console if SMTP not configured |

---

## Dashboard

| Feature | Details |
|---------|---------|
| My khatmas | Grid of all khatmas user belongs to with progress bars |
| Discover section | Public active collective khatmas user hasn't joined |
| Join button | Inline join from discover; disabled with tooltip when at limit |
| New khatma button | Disabled (grayed out) when user is at both type limits |
| Empty states | Friendly messages with call-to-action links |
| Skeleton loaders | Shown while data is fetching |

---

## API Endpoints

### Auth — `POST/GET /auth/*`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `GET  /auth/me`
- `GET  /auth/google` → redirect to Google consent
- `GET  /auth/google/callback` → redirect to frontend with token

### Khatmas — `/khatmas/*`
- `GET    /khatmas` — paginated public collective list
- `POST   /khatmas` — create
- `GET    /khatmas/:id` — detail + parts
- `PATCH  /khatmas/:id` — edit title/description
- `DELETE /khatmas/:id` — soft delete
- `POST   /khatmas/:id/join`
- `DELETE /khatmas/:id/leave`
- `PATCH  /khatmas/:id/participants/:userId/approve`
- `PATCH  /khatmas/:id/settings`
- `POST   /khatmas/:id/invite` — get share link
- `POST   /khatmas/:id/invite/email`
- `GET    /khatmas/join/:token` — validate token
- `POST   /khatmas/:id/parts/:partId/reserve`
- `POST   /khatmas/:id/parts/:partId/complete`
- `DELETE /khatmas/:id/parts/:partId/reservation` — admin unreserve

### Users — `/users/*`
- `GET   /users/me` — profile + stats + history
- `PATCH /users/me` — update profile
- `PATCH /users/me/limits` — update khatma limits
- `GET   /users/me/khatmas` — user's khatmas

### Notifications — `/notifications/*`
- `GET   /notifications` — paginated list
- `PATCH /notifications/mark-all-read`

---

## Data Model (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Account, roles, status, limits, verification flags |
| `Session` | Per-device refresh token tracking |
| `Khatma` | Core entity — settings, iteration, status |
| `QuranPart` | One of 30 parts per khatma |
| `KhatmaParticipant` | User ↔ khatma join with role and status |
| `ReservedPart` | Reservation record with timestamps |
| `Invitation` | Share link with expiry and status |
| `Notification` | Event notification with type, read status |
| `AuditLog` | Action history with old/new snapshots and IP |
| `Group` | *(Schema ready — not yet implemented)* |
| `GroupMember` | *(Schema ready — not yet implemented)* |

---

## Not Yet Implemented

| Feature | Notes |
|---------|-------|
| Password reset | Frontend link exists, no backend flow |
| Email verification | Flag exists in DB, no send/verify flow |
| OTP phone login | Backend ready, no frontend page |
| Notification bell UI | Backend ready, no frontend component |
| Admin dashboard | No UI for admin/moderator role management |
| Group feature | Schema ready, no routes or UI |
| Profile image upload | Uses Google avatar or initials fallback |
| Dark mode | Tailwind setup ready, not wired |
