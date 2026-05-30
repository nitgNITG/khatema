import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async resetKhatmas() {
    const [audit, notif, invite, reserved, khatmas] = await this.db.$transaction([
      this.db.auditLog.deleteMany({ where: { khatmaId: { not: null } } }),
      this.db.notification.deleteMany({ where: { khatmaId: { not: null } } }),
      this.db.invitation.deleteMany({ where: { khatmaId: { not: null } } }),
      this.db.reservedPart.deleteMany({}),
      this.db.khatma.deleteMany({}),
    ]);

    return {
      success: true,
      deleted: {
        auditLogs: audit.count,
        notifications: notif.count,
        invitations: invite.count,
        reservedParts: reserved.count,
        khatmas: khatmas.count,
      },
      message: `تم حذف ${khatmas.count} ختمة مع جميع البيانات المرتبطة. حسابات المستخدمين سليمة.`,
    };
  }

  async resetAll() {
    const [audit, notif, invite, reserved, khatmas, sessions, users] = await this.db.$transaction([
      this.db.auditLog.deleteMany({}),
      this.db.notification.deleteMany({}),
      this.db.invitation.deleteMany({}),
      this.db.reservedPart.deleteMany({}),
      this.db.khatma.deleteMany({}),
      this.db.session.deleteMany({}),
      this.db.user.deleteMany({}),
    ]);

    return {
      success: true,
      deleted: {
        auditLogs: audit.count,
        notifications: notif.count,
        invitations: invite.count,
        reservedParts: reserved.count,
        khatmas: khatmas.count,
        sessions: sessions.count,
        users: users.count,
      },
      message: `تم حذف جميع البيانات بما في ذلك ${users.count} مستخدم.`,
    };
  }
}
