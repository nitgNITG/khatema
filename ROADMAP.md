# Khatema — Roadmap

## ✅ Completed (Live on khatema.nitg-eg.com)

### Core Platform
- Email & password auth + Google OAuth 2.0
- Email OTP verification (6-digit code, rate-limited, `/verify-email` page)
- Create / edit / delete khatmas (collective & individual)
- Edit khatma dates (startDate, endDate) from owner panel
- Hard delete with guard — blocked if any part has been reserved or completed
- 30-part Quran grid: reserve, complete, cancel own reservation, admin-unreserve
- Participant management: join, leave, approve, invite by link or email
- Start date enforcement: reservations blocked before `startDate`
- Deadline notification scheduler: hourly cron, in-app + email, multi-threshold
- Manual participant reminder: owner sends one-click reminder with end date, remaining parts, and invite link

### User Experience
- User profile with stats, history grouped by khatma, sortable
- Notification preferences: choose reminder timing (1h, 6h, 12h, 24h, 48h)
- Real-time updates via WebSocket (all part/khatma events)
- Dashboard: "My Khatmas" + public discover + limits enforcement
- Subscription limits (1–5 active khatmas per type)

### Notifications (Full Stack)
- Bell icon in navbar with live unread badge
- Dropdown with notification list, per-type icons, relative timestamps, khatma deep links
- Mark all read + delete all read notifications
- Real-time push via WebSocket user private room (`user:{id}`)
- All notification types trigger live socket push, no polling needed

### Admin
- SUPER_ADMIN role with guarded endpoints
- Reset khatmas (keep users) and reset all — accessible from profile page danger zone

### Infrastructure
- VPS deployment on khatema.nitg-eg.com (Ubuntu, Nginx, PM2, SSL)
- Rate limiting: 5 req/min on auth, 10 req/min global (throttler guard)
- Redis distributed lock for race-free reservations
- Prisma transaction timeout raised to 15 s to prevent intermittent 500s
- Webpack bundling enabled in NestJS — resolves `@/` path aliases in production
- `rootDir: src` in tsconfig — `dist/main.js` at correct path for PM2

---

## 🔜 Next Features

### High Priority

| # | Feature | Details |
|---|---------|---------|
| 1 | **Password reset** | "Forgot password" → email with reset link → token verified on backend → new password |
| 2 | **Profile image upload** | Upload avatar to Cloudinary/S3; currently shows Google avatar or initials only |
| 3 | **Search & filter khatmas** | Search by title on discover page; filter by completion %, date, or available parts |

### Medium Priority

| # | Feature | Details |
|---|---------|---------|
| 4 | **Participants list page** | Show all members per khatma, their reserved/completed parts, completion rate |
| 5 | **Khatma stats / leaderboard** | Who read the most, timeline chart, race-to-finish between participants |
| 6 | **Admin dashboard** | Full UI for ADMIN role: manage users, roles, view platform stats |
| 7 | **OTP phone login UI** | Frontend page for send-OTP / verify-OTP (backend already built) |
| 8 | **Dua / comment section** | Participants leave a dua or comment per khatma on completion |

### Low Priority / Future

| # | Feature | Details |
|---|---------|---------|
| 9  | **Group feature** | Schema ready — groups with invite codes, group-bound khatmas |
| 10 | **Dark mode** | Tailwind dark class already set up, needs wiring |
| 11 | **CI/CD GitHub Actions** | Auto-deploy to VPS on push to `main` |
| 12 | **Browser push notifications** | PWA service worker for part events even when tab is closed |
| 13 | **Mobile app** | React Native or Flutter wrapper around the same API |
| 14 | **Khatma templates** | Predefined themes (Ramadan, weekly, monthly) with preset settings |
| 15 | **Bookmark / favorite khatmas** | Save khatmas to a personal watchlist without joining |

---

## 🐛 Known Issues

| Issue | Status |
|-------|--------|
| JWT secret is still the dev default — must change before going public | **Critical** — rotate manually in `/var/www/html/khatema/.env` |
| Google OAuth secret & Gmail password exposed in early commit — credentials need rotation | **Critical** — regenerate Google OAuth secret + rotate Gmail App Password |

---

## Deployment Notes

- Deploy: `bash /var/www/html/khatema/deploy.sh main`
- Frontend uses `npm ci` (not `--omit=dev`) because `@tailwindcss/postcss` is a build-time dep in devDependencies
- Every `NEXT_PUBLIC_*` env change requires a full frontend rebuild
- Schema changes: `prisma db push` runs automatically in `deploy.sh`
- PM2 apps: `khatema-backend` (port 3010), `khatema-frontend` (port 3011)
- After a full DB wipe, run: `ALTER TABLE users MODIFY COLUMN notifyBeforeHours longtext NOT NULL DEFAULT '[24]';`
