"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const db = new client_1.PrismaClient();
async function main() {
    console.log('==> Starting khatma reset...\n');
    const [auditDel, notifDel, inviteDel, reservedDel, khatmaDel] = await db.$transaction([
        db.auditLog.deleteMany({ where: { khatmaId: { not: null } } }),
        db.notification.deleteMany({ where: { khatmaId: { not: null } } }),
        db.invitation.deleteMany({ where: { khatmaId: { not: null } } }),
        db.reservedPart.deleteMany({}),
        db.khatma.deleteMany({}),
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
//# sourceMappingURL=reset-khatmas.js.map