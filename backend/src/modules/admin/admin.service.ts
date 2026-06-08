import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { SettingsService, AppSettingsData } from '@/modules/settings/settings.service';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService, private settings: SettingsService) {}

  async getSettings() {
    return this.settings.get();
  }

  async updateSettings(data: Partial<AppSettingsData>, updatedById: string) {
    return this.settings.update(data, updatedById);
  }

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalKhatmas,
      activeKhatmas,
      completedKhatmas,
      totalParts,
      completedParts,
      totalNotifications,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.user.count({ where: { emailVerified: true } }),
      this.db.khatma.count(),
      this.db.khatma.count({ where: { status: 'ACTIVE' } }),
      this.db.khatma.count({ where: { status: 'COMPLETED' } }),
      this.db.quranPart.count(),
      this.db.quranPart.count({ where: { status: 'COMPLETED' } }),
      this.db.notification.count(),
    ]);

    return { totalUsers, activeUsers, totalKhatmas, activeKhatmas, completedKhatmas, totalParts, completedParts, totalNotifications };
  }

  async getUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, any> = search
      ? { OR: [{ displayName: { contains: search } }, { email: { contains: search } }] }
      : {};

    const [rawUsers, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { khatmaParticipations: true } },
        },
      }),
      this.db.user.count({ where }),
    ]);

    const items = rawUsers.map((u) => ({
      ...u,
      khatmaCount: u._count.khatmaParticipations,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async updateUserRole(targetId: string, role: string) {
    const validRoles = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException('دور غير صالح');
    }
    await this.db.user.update({ where: { id: targetId }, data: { role: role as any } });
    return { success: true };
  }

  async deleteUser(targetId: string) {
    await this.db.user.delete({ where: { id: targetId } });
    return { success: true };
  }

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
