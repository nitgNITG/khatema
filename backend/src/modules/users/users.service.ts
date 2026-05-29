import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async getProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true, displayName: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const [totalPartsCompleted, totalKhatmasJoined] = await Promise.all([
      this.db.reservedPart.count({ where: { userId, status: 'COMPLETED' } }),
      this.db.khatmaParticipant.count({ where: { userId, status: 'ACTIVE' } }),
    ]);

    return { ...user, stats: { totalPartsCompleted, totalKhatmasJoined } };
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
