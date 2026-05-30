# Changelog

All notable changes to Khatema are documented here.

---

## [Unreleased] — In Progress

- Fix: WebSocket socket URL strips `/api/v1` so Socket.IO connects to correct root
- Fix: Rate limiting on auth endpoints (5 req/min) via `@nestjs/throttler`
- Pending: JWT secret rotation on VPS

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
