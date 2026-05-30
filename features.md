# Khatema — Feature List

> All features listed here are **fully implemented** and live on khatema.nitg-eg.com.

---

## Authentication

| Feature | Details |
|---------|---------|
| Email & password register | Validation: min 8 chars, uppercase, number, special char |
| Email & password login | JWT access (15 min) + refresh (7 days) via httpOnly cookie |
| Google OAuth 2.0 | Sign in / sign up via Google account |
| Token refresh | Silent rotation via httpOnly cookie |
| Logout | Session revocation on server + client store cleared |
| Session tracking | Per-device session model in DB |
| Email OTP verification | 6-digit code sent on register; `/verify-email` page with 60 s resend cooldown |
| OTP rate limiting | 5 requests/hour per email, 10 requests/hour per IP |
| Rate limiting — auth | 5 requests/minute per IP on all auth endpoints (throttler guard) |

---

## Khatma Management

| Feature | Details |
|---------|---------|
| Create khatma | Title, description, type (Collective/Individual), visibility, settings |
| Individual khatma | Always private; `allowRepeat` and `requireApproval` locked off |
| Collective khatma | Up to configurable max participants; public or private |
| Edit khatma | Owner updates title, description, `startDate`, `endDate` from the detail page |
| Delete khatma | **Hard delete** — removes all related records; blocked if any part is RESERVED or COMPLETED |
| Start date enforcement | Reservations blocked before `startDate`; banner shown in UI when khatma hasn't started |
| End date + countdown | `endDate` shown in header; deadline reminders sent automatically |
| Khatma settings | `allowRepeat`, `requireApproval`, `isContinuous`, `maxMembers`, `visibility` |
| Continuous mode | Auto-resets all parts on completion, increments iteration counter |
| Subscription limits | User sets max active khatmas per type (1–5); enforced on create & join |
| Status tracking | ACTIVE → COMPLETED (automatic when all parts done) |
| Auto-create parts | 30 Quran parts generated automatically on khatma creation |
| Date pickers on create | `startDate` and `endDate` datetime pickers for collective khatmas (optional) |

---

## Quran Parts & Reservations

| Feature | Details |
|---------|---------|
| 30-part grid | Visual 10-column responsive grid with color coding |
| Reserve a part | Click available part → confirmation modal → reserved |
| Cancel own reservation | Click your reserved part → choose "إلغاء الحجز" → record deleted, part released |
| Mark complete | Click your reserved part → choose "أتممت القراءة" → completed |
| Admin unreserve | Khatma owner can cancel any member's reservation |
| Distributed lock | Redis lock (5 s TTL) prevents race-condition double-booking |
| Duplicate prevention | User can't reserve two parts at once (unless `allowRepeat` on) |
| Auto-completion check | Khatma completes automatically when all 30 parts are done |
| Part status colors | Green = available, Amber = reserved, Gray = completed |
| Start date guard | Reserve button inactive + amber banner if khatma hasn't started yet |

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
| Active reservations | Grouped by khatma; sortable by khatma / part number / date |
| Completed parts | Grouped by khatma; sortable by khatma / part number / completion date |
| Completed khatmas | List with title, start date, completion date |
| Khatma limits | Dropdowns (1–5) for collective and individual limits with save |
| Notification preferences | Toggle chips for reminder timing (1h, 6h, 12h, 24h, 48h before deadline) |
| Logout | Button clears session on server + client store |

---

## Deadline Notifications

| Feature | Details |
|---------|---------|
| Scheduler | `@nestjs/schedule` cron job, runs every hour |
| Multiple reminders | Sends in-app + email at each threshold the user chose |
| Duplicate prevention | Redis key tracks which (khatma × user × threshold) has been sent |
| In-app notification | `DEADLINE_REMINDER` type pushed to notifications table |
| Email reminder | HTML email with khatma title, end date, and CTA button |
| User preference | `notifyBeforeHours` JSON array per user (default `[24]`) |

---

## Real-Time Updates (WebSocket)

| Feature | Details |
|---------|---------|
| Socket.IO gateway | JWT-authenticated connection |
| Khatma rooms | Users auto-join the room for the khatma they're viewing |
| `part.reserved` event | Broadcast to room when a part is reserved |
| `part.completed` event | Broadcast to room when a part is completed |
| `part.unreserved` event | Broadcast when a reservation is cancelled or admin-released |
| `khatma.completed` event | Broadcast when all 30 parts are done |
| `khatma.restarted` event | Broadcast when continuous khatma resets |
| Frontend hook | `useRealtime(khatmaId)` — React Query invalidation + toast |

---

## Notifications

| Feature | Details |
|---------|---------|
| 9 notification types | PART_RESERVED, PART_COMPLETED, KHATMA_COMPLETED, KHATMA_JOINED, INVITATION_SENT, JOIN_APPROVED, JOIN_REJECTED, DEADLINE_REMINDER, PART_RELEASED |
| Create notification | Triggered by khatma events via EventEmitter |
| List notifications | Paginated (20/page) |
| Mark as read | Bulk mark-all-read |
| Unread count | Returned alongside list |

---

## Email

| Feature | Details |
|---------|---------|
| Khatma invite email | Sent when owner invites by email; includes khatma title + CTA button |
| Email OTP | 6-digit verification code with branded HTML template |
| Deadline reminder | HTML email with hours remaining, end date, link to khatma |
| SMTP via Nodemailer | Gmail (or any SMTP) with env-configured credentials |
| Fallback logging | Logs email content to console if SMTP not configured |

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

### Auth — `/auth/*`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account + send email OTP |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/refresh` | Rotate access token using refresh cookie |
| POST | `/auth/logout` | Revoke session |
| POST | `/auth/send-email-otp` | Resend email verification OTP (auth required) |
| POST | `/auth/verify-email` | Verify OTP → mark email verified |
| POST | `/auth/send-otp` | Phone OTP (backend only) |
| POST | `/auth/verify-otp` | Verify phone OTP |
| GET  | `/auth/me` | Current user info |
| GET  | `/auth/google` | Redirect to Google consent |
| GET  | `/auth/google/callback` | Google OAuth callback |

### Khatmas — `/khatmas/*`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/khatmas` | Paginated public collective list |
| POST   | `/khatmas` | Create khatma |
| GET    | `/khatmas/:id` | Detail + parts + participants |
| PATCH  | `/khatmas/:id` | Edit title, description, startDate, endDate |
| DELETE | `/khatmas/:id` | Hard delete (blocked if any part started) |
| POST   | `/khatmas/:id/join` | Join khatma |
| DELETE | `/khatmas/:id/leave` | Leave khatma |
| PATCH  | `/khatmas/:id/participants/:userId/approve` | Approve join request |
| PATCH  | `/khatmas/:id/settings` | Update khatma settings |
| POST   | `/khatmas/:id/invite` | Generate share link |
| POST   | `/khatmas/:id/invite/email` | Send invite by email |
| GET    | `/khatmas/join/:token` | Validate invite token |
| POST   | `/khatmas/:id/parts/:partId/reserve` | Reserve a part |
| POST   | `/khatmas/:id/parts/:partId/complete` | Mark part complete |
| DELETE | `/khatmas/:id/parts/:partId/my-reservation` | Cancel own reservation |
| DELETE | `/khatmas/:id/parts/:partId/reservation` | Admin unreserve any part |

### Users — `/users/*`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/users/me` | Profile + stats + history |
| PATCH  | `/users/me` | Update display name / avatar |
| PATCH  | `/users/me/limits` | Update khatma limits (1–5) |
| PATCH  | `/users/me/notifications` | Update `notifyBeforeHours` array |
| GET    | `/users/me/khatmas` | User's khatmas |

### Notifications — `/notifications/*`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/notifications` | Paginated list + unread count |
| PATCH  | `/notifications/mark-all-read` | Mark all read |

---

## Data Model (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Account, roles, status, limits, `emailVerified`, `notifyBeforeHours` |
| `Session` | Per-device refresh token tracking |
| `Khatma` | Core entity — settings, `startDate`, `endDate`, iteration, status |
| `QuranPart` | One of 30 parts per khatma |
| `KhatmaParticipant` | User ↔ khatma join with role and status |
| `ReservedPart` | Reservation record; deleted on cancel, preserved on complete |
| `Invitation` | Share link with expiry and status |
| `Notification` | Event notification with type, read status |
| `AuditLog` | Action history with old/new snapshots and IP |
| `Group` | *(Schema ready — not yet implemented)* |
| `GroupMember` | *(Schema ready — not yet implemented)* |

---

## Not Yet Implemented

| Feature | Notes |
|---------|-------|
| Password reset | "Forgot password" link present, no backend flow |
| Notification bell UI | Backend + data model ready, no navbar component |
| Admin dashboard | No UI for admin/moderator role management |
| Group feature | Schema ready, no routes or UI |
| Profile image upload | Uses Google avatar or initials fallback |
| Dark mode | Tailwind dark class set up, not wired |
| OTP phone login UI | Backend endpoint ready, no frontend page |
