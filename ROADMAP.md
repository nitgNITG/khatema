# Khatema — Roadmap

## ✅ Completed (Live on khatema.nitg-eg.com)

- Email & password auth + Google OAuth
- Create / edit / delete khatmas (collective & individual)
- 30-part Quran grid with reserve / complete / admin-unreserve
- Participant management (join, leave, approve, invite by link or email)
- User profile with stats, history, and subscription limits
- Real-time updates via WebSocket (part reserved/completed events)
- Notifications backend (types, pagination, mark-read)
- Dashboard with "My Khatmas" + public discover section
- Subscription limits (1–5 active khatmas per type, enforced on backend)
- VPS deployment on khatema.nitg-eg.com

---

## 🔜 Next Features

### High Priority

| # | Feature | Details |
|---|---------|---------|
| 1 | **Password reset** | "Forgot password" sends email with reset link; backend token + expiry |
| 2 | **Notification bell UI** | Bell icon in navbar, badge count, dropdown list, mark-read |
| 3 | **Profile image upload** | Upload avatar to server or Cloudinary; currently shows Google avatar or initials |
| 4 | **Email verification** | Send verification email on register; restrict some actions to verified users |

### Medium Priority

| # | Feature | Details |
|---|---------|---------|
| 5 | **OTP phone login** | Frontend page for send-OTP / verify-OTP (backend already built) |
| 6 | **Khatma deadline** | Owner sets end date; reminder notification sent before deadline |
| 7 | **Participant list page** | Show all members, their reserved parts, and completion rate |
| 8 | **Search & filter** | Search public khatmas by title; filter by completion % or date |

### Low Priority / Future

| # | Feature | Details |
|---|---------|---------|
| 9 | **Group feature** | Schema ready — groups with invite codes, group-bound khatmas |
| 10 | **Admin dashboard** | Manage users, khatmas, view stats (requires ADMIN role) |
| 11 | **Dark mode** | Tailwind dark class already set up, needs wiring |
| 12 | **CI/CD GitHub Actions** | Auto-deploy to VPS on push to `main` |
| 13 | **Push notifications** | Browser push notifications for part events |
| 14 | **Mobile app** | React Native or Flutter wrapper around the same API |

---

## 🐛 Known Issues

| Issue | Status |
|-------|--------|
| WebSocket real-time — `useRealtime` hook fires but UI doesn't always refresh without manual reload | Open |
| No rate limiting on auth endpoints (brute-force risk) | Open |
| JWT secret is still the dev default — must change before going public | **Critical** |

---

## Deployment Notes

- Every frontend change requires `npm run build` + `pm2 restart khatema-frontend`
- Every backend change requires `npm run build` + `pm2 restart khatema-backend`
- `NEXT_PUBLIC_*` env changes require a full frontend rebuild
- Run `deploy.sh main` from `/var/www/html/khatema` to do a full redeploy
