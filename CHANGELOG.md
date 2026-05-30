# Changelog

All notable changes to Khatema are documented here.

---

## [1.6.0] — 2026-05-30 — Notifications Bell, Real-Time Push, Admin Panel

### Added

**Notification Bell UI**
- Bell icon in the dashboard navbar with live red unread badge (99+ cap)
- Dropdown with full notification list: per-type emoji icons, unread dot, relative timestamps, khatma deep links
- "تعليم الكل كمقروء" — mark all as read
- "حذف المقروءة" — delete all read notifications (new `DELETE /notifications/read` endpoint)

**Real-Time Notification Push (WebSocket)**
- Each user auto-joins a private room `user:{id}` on socket connect
- `NotificationsService.create()` emits `notification.created` event after every DB write
- `KhatmaGateway` listens and pushes `new_notification` to the user's private room instantly
- `khatma.completed` notifications converted from `createMany` to per-user `create()` loop so all fire real-time events

**Manual Participant Reminder**
- Owner sends one-click reminder from khatma detail page
- Sends in-app notification + rich HTML email to all active participants
- Email includes: end date, remaining parts count, and a fresh 7-day invite link
- Invite link shown in owner panel with copy button after sending
- `POST /khatmas/:id/notify` endpoint

**Super Admin Panel**
- `SUPER_ADMIN` role guarded by `RolesGuard`
- `DELETE /admin/reset/khatmas` — deletes all khatmas + related data, keeps user accounts
- `DELETE /admin/reset/all` — full DB wipe including users
- Danger-zone panel in profile page, visible only to SUPER_ADMIN; double-confirm dialogs

### Fixed

**Build & Production Fixes**
- `rootDir: src` added to `tsconfig.json` — `dist/main.js` now at correct path for `node dist/main` and PM2
- `prisma/**/*.ts` excluded from `tsconfig.build.json` — scripts outside `src/` no longer break the build
- Webpack enabled in `nest-cli.json` — `@/` path aliases resolved at build time, no runtime `MODULE_NOT_FOUND` errors
- Prisma transaction timeout raised from 5 s to 15 s (maxWait: 10 s) — eliminates intermittent 500 errors under slow DB connections
- `notifyBeforeHours` column: MySQL default `'[24]'` applied via `ALTER TABLE` — `NULL constraint violation` on register resolved

---

## [1.5.0] — 2026-05-30 — Manual Notify, Build Fixes

> Rolled into 1.6.0 above.

---

## [1.4.0] — 2026-05-30 — Cancel Reservation, Khatma Dates, Email OTP

### Added

**Cancel Own Reservation**
- Users can cancel their own reserved part (releases it back to AVAILABLE, deletes the record)
- Clicking a reserved part now opens a modal with two options: "أتممت القراءة" or "إلغاء الحجز"
- `DELETE /khatmas/:id/parts/:partId/my-reservation` endpoint

**Khatma Start/End Dates**
- `startDate` and `endDate` already in schema — now enforced in reservation flow
- Reserving before `startDate` returns `400 لم يبدأ وقت الحجز بعد`
- Khatma detail page shows "يبدأ الحجز في X" banner with amber styling when start date is in the future
- Create khatma form has date/time pickers for start and end (collective khatmas only)

**Email OTP Verification**
- On registration, a 6-digit OTP is emailed automatically; user is redirected to `/verify-email`
- Rate limits: 5 OTP requests per email per hour, 10 per IP per hour
- `POST /auth/send-email-otp` — resend OTP (requires auth)
- `POST /auth/verify-email` — verify OTP, marks `emailVerified = true`
- New page: `/verify-email` — OTP input with 60-second resend cooldown

**Deadline Notifications**
- `@nestjs/schedule` cron job runs every hour, checks khatmas with upcoming `endDate`
- For each participant, sends both in-app notification and email reminder
- Users can set multiple reminder times (1h, 6h, 12h, 24h, 48h before deadline)
- `PATCH /users/me/notifications` — save `notifyBeforeHours` array preference
- Profile page has new "تذكير قبل انتهاء الختمة" section with toggle chips

### Schema changes
- Added `notifyBeforeHours Json @default("[24]")` to User model

---

## [1.3.0] — 2026-05-30 — Known Issues Fixed + Deployment Stabilized

### Fixed
- `REDIS_PASSWORD` env var support to handle passwords with special characters (`/`, `=`)
- Google OAuth URL hardcoded as `localhost:3001` in login/register pages — replaced with `NEXT_PUBLIC_API_URL`
- Socket.io client connecting to wrong URL (included `/api/v1` path)
- Rate limiting added to all auth endpoints (5 requests/minute)
- `npm prune` was removing `@prisma/client` — replaced with explicit `prisma generate`
- PM2 relative `cwd` paths caused `BUILD_ID` not found — changed to absolute paths
- Port conflicts on shared VPS — backend moved to 3010, frontend to 3011
- Next.js 16 migration: `middleware.ts` → `proxy.ts`, renamed export to `proxy`
- `useQuery onSuccess` deprecated — moved to `useEffect`

### Docs
- Added `features.md` — complete list of all implemented features
- Added `ROADMAP.md` — upcoming features and known issues
- Added `CHANGELOG.md` (this file)

---

## [1.2.0] — 2026-05-29 — VPS Deployment

### Added
- `nginx/khatema.nitg-eg.com.conf` — production Nginx config with SSL + WebSocket support
- `ecosystem.config.js` — PM2 config for backend (port 3010) + frontend (port 3011)
- `deploy.sh` — one-command deploy: pull → build → pm2 reload
- `DEPLOY.md` — step-by-step VPS setup guide with checklist

### Fixed
- Individual khatmas excluded from public `/khatmas` discover endpoint
- `deploy.sh` uses `./node_modules/.bin/prisma` instead of `npx prisma` to avoid version mismatch

---

## [1.1.0] — 2026-05-21 — Full Feature Set

### Added

**Khatma Management**
- Delete khatma (soft delete, owner only)
- Edit khatma title and description (owner only)
- Subscription limits: `maxCollectiveKhatmas` and `maxIndividualKhatmas` per user (1–5)
- Limits enforced on backend `create` and `join`
- Dashboard shows dimmed "+ ختمة جديدة" when at both limits
- "انضم" button disabled with tooltip when at collective limit
- Individual khatmas force: `visibility=PRIVATE`, `requireApproval=false`, `allowRepeat=false`
- Individual khatma settings section dimmed in create form

**User Profile**
- Full profile page: avatar (Google or initials), display name, email
- Stats: total khatmas joined, parts completed, khatmas completed
- Active reservations with `reservedAt` date
- Completed parts with `reservedAt` + `completedAt`
- Completed khatmas with `startDate` + `completedAt`
- Subscription limits editor (dropdowns 1–5, save button)
- Logout button

**Admin Features**
- Khatma owner can unreserve any member's reserved part from the parts grid
- Admin sees red hover + "إلغاء؟" label on other users' reserved parts
- Legend shows red indicator when viewing as admin

**Dashboard**
- "ختماتي" section — all khatmas the user belongs to
- "ختمات عامة — انضم الآن" discover section — public active collective khatmas

**Invite Flow**
- After login/register via invite link, redirect back to the original invite URL

**Auth**
- Google OAuth: backend redirects to `${FRONTEND_URL}/auth/callback?token=...&user=...`
- `/auth/callback` page wrapped in `<Suspense>` (Next.js 14/16 requirement)
- `/auth/callback` added to `PUBLIC_PATHS` in middleware

### Fixed
- NestJS route ordering: `GET join/:token` declared before `GET :id`
- `ReservationStatus.RELEASED` used instead of non-existent `CANCELLED`
- `prisma db push` used instead of `prisma migrate dev` (remote DB lacks CREATE DATABASE)

---

## [1.0.0] — 2026-05-10 — Initial Release

### Added

**Backend (NestJS + Prisma + MySQL)**
- Auth module: register, login, JWT RS256 (15min access + 7d refresh), logout, session tracking
- Google OAuth 2.0 (Passport.js strategy)
- OTP flow: generate/store in Redis (5min TTL), verify
- Khatma module: CRUD, join/leave, approve, settings, invitation links
- 30-part Quran structure auto-created per khatma
- Reservation service: Redis distributed lock (5s TTL) + DB transaction
- Continuous khatma mode (auto-reset on completion)
- Email invitations via Nodemailer (SMTP)
- WebSocket gateway (Socket.IO): room-based broadcasting for all part/khatma events
- Notifications service: 9 types, pagination, mark-read
- Users service: profile, stats, active reservations, completed history
- Audit log model

**Frontend (Next.js 16 + Tailwind + RTL)**
- Auth pages: login, register with Google OAuth button
- Dashboard: my khatmas + public discover + skeleton loaders
- Khatma detail: parts grid, progress bar, invite modal, reservation modal
- Parts grid: color-coded (green/amber/gray), click-to-reserve, click-to-complete
- Real-time updates via `useRealtime` hook (Socket.IO)
- Khatma create form: type selector, visibility, settings
- Profile page with full history and limits editor
- Dashboard layout with sticky navbar and avatar

**Infrastructure**
- Docker Compose (dev): Postgres, Redis, Nginx, backend, frontend
- `.env.example` with all required variables (no real credentials)
- Git branching: `develop` (work) → `main` (production)

---

## Security Incidents

### 2026-05-21 — Credentials Exposed in `.env.example`
- Real Google OAuth client ID/secret and Gmail app password were committed to `.env.example`
- **Action taken:** Immediately removed, committed clean version, ran `git-filter-repo` to purge from all commit history, force-pushed both branches
- **Required follow-up:** Regenerate Google OAuth secret + rotate Gmail App Password ⚠️
