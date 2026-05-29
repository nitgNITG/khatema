import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async getProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true, maxCollectiveKhatmas: true, maxIndividualKhatmas: true },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const [reservations, completedKhatmasParticipations, activeKhatmasCount] = await Promise.all([
      this.db.reservedPart.findMany({
        where: { userId },
        include: {
          part: { select: { partNumber: true } },
          khatma: { select: { id: true, title: true } },
        },
        orderBy: { reservedAt: 'desc' },
      }),
      this.db.khatmaParticipant.findMany({
        where: { userId, status: 'ACTIVE', khatma: { status: 'COMPLETED' } },
        include: { khatma: { select: { id: true, title: true, createdAt: true, completedAt: true } } },
        orderBy: { joinedAt: 'desc' },
      }),
      this.db.khatmaParticipant.count({
        where: { userId, status: 'ACTIVE', khatma: { status: 'ACTIVE' } },
      }),
    ]);

    const activeReservations = reservations.filter((r) => r.status === 'RESERVED');
    const completedParts = reservations.filter((r) => r.status === 'COMPLETED');

    return {
      ...user,
      stats: {
        totalPartsCompleted: completedParts.length,
        totalKhatmasJoined: activeKhatmasCount,
        totalKhatmasCompleted: completedKhatmasParticipations.length,
      },
      activeReservations: activeReservations.map((r) => ({
        id: r.id,
        partNumber: r.part.partNumber,
        khatmaId: r.khatmaId,
        khatmaTitle: r.khatma.title,
        reservedAt: r.reservedAt,
      })),
      completedParts: completedParts.map((r) => ({
        id: r.id,
        partNumber: r.part.partNumber,
        khatmaId: r.khatmaId,
        khatmaTitle: r.khatma.title,
        reservedAt: r.reservedAt,
        completedAt: r.completedAt,
      })),
      completedKhatmas: completedKhatmasParticipations.map((p) => ({
        id: p.khatma.id,
        title: p.khatma.title,
        startDate: p.khatma.createdAt,
        completedAt: p.khatma.completedAt,
      })),
    };
  }

  async updateLimits(userId: string, data: { maxCollectiveKhatmas?: number; maxIndividualKhatmas?: number }) {
    const clamp = (n: number) => Math.min(Math.max(1, Math.round(n)), 5);
    return this.db.user.update({
      where: { id: userId },
      data: {
        ...(data.maxCollectiveKhatmas !== undefined && { maxCollectiveKhatmas: clamp(data.maxCollectiveKhatmas) }),
        ...(data.maxIndividualKhatmas !== undefined && { maxIndividualKhatmas: clamp(data.maxIndividualKhatmas) }),
      },
      select: { maxCollectiveKhatmas: true, maxIndividualKhatmas: true },
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    return this.db.user.update({
      where: { id: userId },
      data,
      select: { id: true, displayName: true, avatarUrl: true },
    });
  }

  async getMyKhatmas(userId: string) {
    const participations = await this.db.khatmaParticipant.findMany({
      where: { userId, status: { in: ['ACTIVE', 'PENDING'] } },
      include: {
        khatma: {
          include: {
            creator: { select: { id: true, displayName: true } },
            parts: { select: { status: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return participations.map((p: typeof participations[number]) => ({
      ...p.khatma,
      myRole: p.role,
      myStatus: p.status,
      completionPercentage: Math.round(
        (p.khatma.parts.filter((pt: { status: string }) => pt.status === 'COMPLETED').length / p.khatma.totalParts) * 100,
      ),
    }));
  }
}
