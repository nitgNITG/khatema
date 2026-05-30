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

### User Experience
- User profile with stats, history grouped by khatma, sortable
- Notification preferences: choose reminder timing (1h, 6h, 12h, 24h, 48h)
- Real-time updates via WebSocket (all part/khatma events)
- Dashboard: "My Khatmas" + public discover + limits enforcement
- Subscription limits (1–5 active khatmas per type)

### Infrastructure
- VPS deployment on khatema.nitg-eg.com (Ubuntu, Nginx, PM2, SSL)
- Rate limiting: 5 req/min on auth, 10 req/min global (throttler guard)
- Redis distributed lock for race-free reservations
- WebSocket URL fix (strips `/api/v1` before connecting)

---

## 🔜 Next Features

### High Priority

| # | Feature | Details |
|---|---------|---------|
| 1 | **Notification bell UI** | Bell icon in navbar, badge unread count, dropdown list, mark-read |
| 2 | **Password reset** | "Forgot password" sends email with reset link; backend token + expiry |
| 3 | **Profile image upload** | Upload avatar; currently shows Google avatar or initials only |

### Medium Priority

| # | Feature | Details |
|---|---------|---------|
| 4 | **Participant list page** | Show all members, their reserved parts, and completion rate |
| 5 | **Search & filter khatmas** | Search by title; filter discover list by completion % or date |
| 6 | **OTP phone login UI** | Frontend page for send-OTP / verify-OTP (backend already built) |
| 7 | **Khatma stats page** | Completion timeline, who read what, race to finish leaderboard |

### Low Priority / Future

| # | Feature | Details |
|---|---------|---------|
| 8 | **Group feature** | Schema ready — groups with invite codes, group-bound khatmas |
| 9 | **Admin dashboard** | Manage users, khatmas, view platform stats (requires ADMIN role) |
| 10 | **Dark mode** | Tailwind dark class already set up, needs wiring |
| 11 | **CI/CD GitHub Actions** | Auto-deploy to VPS on push to `main` |
| 12 | **Push notifications** | Browser push for part events |
| 13 | **Mobile app** | React Native or Flutter wrapper around the same API |

---

## 🐛 Known Issues

| Issue | Status |
|-------|--------|
| JWT secret is still the dev default — must change before going public | **Critical** — rotate manually in `/var/www/html/khatema/.env` |
| No notification bell in the navbar UI | Planned — backend ready |

---

## Deployment Notes

- Deploy: `bash /var/www/html/khatema/deploy.sh main`
- Frontend uses `npm ci` (not `--omit=dev`) because `@tailwindcss/postcss` is a build-time dep in devDependencies
- Every `NEXT_PUBLIC_*` env change requires a full frontend rebuild
- Schema changes: `prisma db push` runs automatically in `deploy.sh`
- PM2 apps: `khatema-backend` (port 3010), `khatema-frontend` (port 3011)
