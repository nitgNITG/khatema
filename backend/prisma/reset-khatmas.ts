/**
 * Reset script — deletes all khatma data, keeps user accounts.
 *
 * Run:  npx ts-node -r tsconfig-paths/register prisma/reset-khatmas.ts
 * Or:   npm run reset:khatmas
 *
 * What it deletes (in FK-safe order):
 *   audit_logs (khatmaId rows) → notifications (khatmaId rows) →
 *   invitations (khatmaId rows) → reserved_parts → khatmas
 *   (quran_parts and khatma_participants cascade from khatmas)
 *
 * What it keeps:
 *   users, sessions, groups, group_members
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('==> Starting khatma reset...\n');

  const [auditDel, notifDel, inviteDel, reservedDel, khatmaDel] = await db.$transaction([
    db.auditLog.deleteMany({ where: { khatmaId: { not: null } } }),
    db.notification.deleteMany({ where: { khatmaId: { not: null } } }),
    db.invitation.deleteMany({ where: { khatmaId: { not: null } } }),
    db.reservedPart.deleteMany({}),
    db.khatma.deleteMany({}),
    // quran_parts + khatma_participants cascade-delete when khatmas row is removed
  ]);

  console.log(`  audit_logs deleted:    ${auditDel.count}`);
  console.log(`  notifications deleted: ${notifDel.count}`);
  console.log(`  invitations deleted:   ${inviteDel.count}`);
  console.log(`  reserved_parts deleted: ${reservedDel.count}`);
  console.log(`  khatmas deleted:       ${khatmaDel.count}`);
  console.log(`  (quran_parts + khatma_participants cascade-deleted with khatmas)\n`);
  console.log('==> Reset complete. User accounts are intact.');
}

main()
  .catch((e) => { console.error('Reset failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
