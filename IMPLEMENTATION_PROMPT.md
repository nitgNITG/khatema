# Implementation Prompt — Review Before Executing

## Scope: 3 New Features

---

## Feature 1 — Cancel Own Reservation

### What
A user who has reserved a part can cancel their own reservation (release it back to AVAILABLE so others can take it).

### Current behavior
Clicking a part you reserved shows `confirm("هل أتممت قراءة الجزء X؟")` — only option is to mark complete.

### New behavior
Clicking your reserved part opens a modal with two buttons:
- **أتممت القراءة** — marks part as COMPLETED (existing flow)
- **إلغاء الحجز** — releases the part back to AVAILABLE

### Backend changes
- `reservation.service.ts` — add `cancelReservation(userId, khatmaId, partId)`:
  - Find `ReservedPart` where `userId`, `partId`, `status=RESERVED`
  - Set `ReservedPart.status = RELEASED`
  - Set `QuranPart.status = AVAILABLE`
  - Emit `part.unreserved` event (already exists in gateway)
- `khatma.controller.ts` — add `DELETE /khatmas/:id/parts/:partId/my-reservation`

### Frontend changes
- `khatma/[id]/page.tsx` — replace `confirm()` with a modal showing both options
- Add `cancelMutation` calling `DELETE /khatmas/:id/parts/:partId/my-reservation`

---

## Feature 2 — Khatma Start/End Dates + Deadline Notifications

### What
Owner sets a `startDate` and `endDate` when creating a khatma. No one can reserve parts before `startDate`. Notifications go out before `endDate`.

### Database changes (Prisma)
```prisma
model Khatma {
  // existing fields...
  startDate   DateTime?
  endDate     DateTime?
  // notifyBeforeHours already exists as field or add:
}

model User {
  // existing fields...
  notifyBeforeHours  Int  @default(24)  // user-configurable reminder timing
}
```
Run `prisma db push` after schema change.

### Backend changes

**`khatma.service.ts` — create()**
- Accept `startDate` and `endDate` in `CreateKhatmaDto`
- Save to DB

**`reservation.service.ts` — reserve()**
- Add check: if `khatma.startDate && new Date() < khatma.startDate` → throw `BadRequestException('لم يبدأ وقت الحجز بعد')`

**`create-khatma.dto.ts`**
- Add `startDate?: Date` and `endDate?: Date`

**Notification scheduler (new service)**
- Use `@nestjs/schedule` (`npm install @nestjs/schedule`)
- Cron job runs every hour: `@Cron('0 * * * *')`
- Query khatmas where `endDate` is within `user.notifyBeforeHours` hours
- For each participant, send:
  - App notification via `NotificationsService`
  - Email via `MailService`
- Track sent notifications to avoid duplicates (add `deadlineReminderSent` flag to Khatma or use Redis key)

**`users.controller.ts`**
- Add `PATCH /users/me/notifications` to update `notifyBeforeHours`

### Frontend changes

**`khatma/new/page.tsx`**
- Add date/time pickers for `startDate` and `endDate`
- Show them only for COLLECTIVE khatmas
- Validate: `endDate > startDate`

**`profile/page.tsx`**
- Add "وقت التذكير قبل الانتهاء" section: input or select for hours (options: 1, 6, 12, 24, 48)
- Call `PATCH /users/me/notifications`

**`khatma/[id]/page.tsx`**
- Show start/end dates in the header
- If `startDate > now`: show countdown or "يبدأ الحجز في X"
- Disable reserve button with tooltip if before start date

---

## Feature 3 — Email OTP Verification on Registration

### What
After registering, user receives a 6-digit OTP to their email. They must verify before they can use the app. Rate limits prevent abuse.

### Rate limits
- Max 5 OTP requests per email per hour → return `429` with "انتظر ساعة قبل المحاولة مجدداً"
- Max 10 OTP requests from same IP per hour → block entirely (Redis key: `otp:block:ip:{ip}`)

### Database changes
```prisma
model User {
  // existing fields...
  isEmailVerified  Boolean  @default(false)
}
```

### Backend changes

**Redis keys used**
- `otp:email:{email}` — stores hashed OTP + expiry (5 min TTL)
- `otp:count:email:{email}` — counter per email (1h TTL)
- `otp:count:ip:{ip}` — counter per IP (1h TTL)

**`auth.service.ts`**
- `register()`: after creating user, call `sendEmailOtp(email, ip)`
- `sendEmailOtp(email, ip)`:
  1. Check `otp:count:ip:{ip}` ≥ 10 → throw `429`
  2. Check `otp:count:email:{email}` ≥ 5 → throw `429`
  3. Generate 6-digit OTP, hash it (bcrypt or SHA256), store in `otp:email:{email}` (5 min TTL)
  4. Increment counters
  5. Send email via `MailService`
- `verifyEmailOtp(userId, otp)`:
  1. Fetch stored OTP from Redis
  2. Compare (timing-safe)
  3. If match: set `user.isEmailVerified = true`, delete Redis key
  4. If no match: throw `UnauthorizedException`

**`auth.controller.ts`**
- `POST /auth/send-email-otp` — send/resend OTP (rate limited)
- `POST /auth/verify-email` — verify OTP, mark email verified

**Guards / middleware**
- Optional: add `@RequireEmailVerified()` decorator to sensitive endpoints (like creating khatmas)
- OR show banner in UI — less disruptive

### Frontend changes

**`register/page.tsx`** — after successful registration, redirect to `/verify-email` instead of `/dashboard`

**New page: `verify-email/page.tsx`**
- Input for 6-digit OTP
- "إعادة الإرسال" button (disabled for 60s after each send)
- Shows countdown if rate limited
- On success: redirect to `/dashboard`

**`proxy.ts` (middleware)**
- Add `/verify-email` to `PUBLIC_PATHS`

---

## Summary of Backend Packages to Install
```bash
npm install @nestjs/schedule
```

## Summary of DB Changes
```prisma
model Khatma {
  startDate          DateTime?
  endDate            DateTime?
}

model User {
  isEmailVerified    Boolean  @default(false)
  notifyBeforeHours  Int      @default(24)
}
```

## API Endpoints Summary (new)
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/khatmas/:id/parts/:partId/my-reservation` | User cancels own reservation |
| POST | `/auth/send-email-otp` | Send/resend email verification OTP |
| POST | `/auth/verify-email` | Verify OTP + mark email verified |
| PATCH | `/users/me/notifications` | Update notification timing preference |

---

## ⚠️ Review Before Implementing

1. **Cancel reservation** — should cancelled reservations be deletable or always kept as `RELEASED` in history?
2. **Start date** — if no `startDate` is set, reservations are open immediately (current behavior preserved)?
3. **Email OTP** — should existing users (already registered without OTP) be forced to verify, or only new registrations?
4. **Notification timing** — should multiple reminders be sent (e.g., at 48h AND 24h), or just once at the user's chosen time?
