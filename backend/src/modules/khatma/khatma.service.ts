import {
  Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { MailService } from '@/modules/mail/mail.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateKhatmaDto } from './dto/create-khatma.dto';

@Injectable()
export class KhatmaService {
  constructor(
    private db: DatabaseService,
    private mail: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateKhatmaDto) {
    const khatma = await this.db.$transaction(async (tx) => {
      // Check active khatma limits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { maxCollectiveKhatmas: true, maxIndividualKhatmas: true },
      });
      if (user) {
        const activeCount = await tx.khatmaParticipant.count({
          where: { userId, status: 'ACTIVE', khatma: { type: dto.type, status: 'ACTIVE', deletedAt: null } },
        });
        const limit = dto.type === 'COLLECTIVE' ? user.maxCollectiveKhatmas : user.maxIndividualKhatmas;
        const typeLabel = dto.type === 'COLLECTIVE' ? 'الجماعية' : 'الفردية';
        if (activeCount >= limit) {
          throw new ConflictException(`وصلت للحد الأقصى للختمات ${typeLabel} (${limit}). يمكنك تغيير الحد من بروفايلك`);
        }
      }

      const k = await tx.khatma.create({
        data: {
          creatorId: userId,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          visibility: dto.visibility,
          requireApproval: dto.requireApproval ?? false,
          allowRepeat: dto.allowRepeat ?? false,
          isContinuous: dto.isContinuous ?? false,
          autoRedistribute: dto.autoRedistribute ?? false,
          maxMembers: dto.maxMembers,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          groupId: dto.groupId,
        },
      });

      // Auto-create 30 Quran parts
      await tx.quranPart.createMany({
        data: Array.from({ length: 30 }, (_, i) => ({
          khatmaId: k.id,
          partNumber: i + 1,
          status: 'AVAILABLE' as const,
        })),
      });

      // Add creator as OWNER participant
      await tx.khatmaParticipant.create({
        data: { khatmaId: k.id, userId, role: 'OWNER', status: 'ACTIVE' },
      });

      return k;
    });

    return this.findById(khatma.id, userId);
  }

  async findAll(query: { page?: number; limit?: number; status?: string; visibility?: string; q?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      visibility: query.visibility || 'PUBLIC',
      type: 'COLLECTIVE',
      ...(query.status && { status: query.status }),
      ...(query.q && { title: { contains: query.q, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.db.khatma.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, displayName: true, avatarUrl: true } },
          _count: { select: { participants: true, parts: true } },
        },
      }),
      this.db.khatma.count({ where }),
    ]);

    return {
      items: items.map((k) => this.formatKhatma(k)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total },
    };
  }

  async findById(id: string, userId?: string) {
    const khatma = await this.db.khatma.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        parts: {
          orderBy: { partNumber: 'asc' },
          include: {
            reservation: {
              include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
            },
          },
        },
        participants: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!khatma) throw new NotFoundException('الختمة غير موجودة');

    if (khatma.visibility === 'PRIVATE' && userId) {
      const isParticipant = khatma.participants.some((p) => p.userId === userId);
      if (!isParticipant && khatma.creatorId !== userId) {
        throw new ForbiddenException('ليس لديك صلاحية للوصول');
      }
    }

    return this.formatKhatma(khatma);
  }

  async join(khatmaId: string, userId: string, invitationToken?: string) {
    const khatma = await this.db.khatma.findFirst({
      where: { id: khatmaId, deletedAt: null },
    });

    if (!khatma) throw new NotFoundException('الختمة غير موجودة');
    if (khatma.status !== 'ACTIVE') throw new BadRequestException('الختمة غير نشطة');

    const existing = await this.db.khatmaParticipant.findUnique({
      where: { khatmaId_userId: { khatmaId, userId } },
    });

    if (existing) throw new ConflictException('أنت عضو بالفعل في هذه الختمة');

    // Check user's collective khatma limit
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { maxCollectiveKhatmas: true },
    });
    if (user) {
      const activeCount = await this.db.khatmaParticipant.count({
        where: { userId, status: 'ACTIVE', khatma: { type: 'COLLECTIVE', status: 'ACTIVE', deletedAt: null } },
      });
      if (activeCount >= user.maxCollectiveKhatmas) {
        throw new ConflictException(`وصلت للحد الأقصى للختمات الجماعية (${user.maxCollectiveKhatmas}). يمكنك تغيير الحد من بروفايلك`);
      }
    }

    if (khatma.maxMembers) {
      const count = await this.db.khatmaParticipant.count({
        where: { khatmaId, status: 'ACTIVE' },
      });
      if (count >= khatma.maxMembers) throw new ConflictException('الختمة ممتلئة');
    }

    const status = khatma.requireApproval && !invitationToken ? 'PENDING' : 'ACTIVE';

    const participant = await this.db.khatmaParticipant.create({
      data: { khatmaId, userId, role: 'MEMBER', status },
    });

    return { participantId: participant.id, status: participant.status };
  }

  async leave(khatmaId: string, userId: string) {
    const participant = await this.db.khatmaParticipant.findUnique({
      where: { khatmaId_userId: { khatmaId, userId } },
    });

    if (!participant) throw new NotFoundException('أنت لست عضواً في هذه الختمة');
    if (participant.role === 'OWNER') throw new ForbiddenException('المالك لا يمكنه المغادرة');

    await this.db.$transaction(async (tx) => {
      // Release active reservations
      await tx.reservedPart.updateMany({
        where: { khatmaId, userId, status: 'RESERVED' },
        data: { status: 'RELEASED' },
      });
      await tx.quranPart.updateMany({
        where: {
          khatmaId,
          reservation: { userId, status: 'RELEASED' },
        },
        data: { status: 'AVAILABLE' },
      });

      await tx.khatmaParticipant.update({
        where: { khatmaId_userId: { khatmaId, userId } },
        data: { status: 'LEFT', leftAt: new Date() },
      });
    });
  }

  async approveJoin(khatmaId: string, targetUserId: string, adminUserId: string) {
    const admin = await this.db.khatmaParticipant.findUnique({
      where: { khatmaId_userId: { khatmaId, userId: adminUserId } },
    });

    if (!admin || !['OWNER', 'ADMIN'].includes(admin.role)) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }

    await this.db.khatmaParticipant.update({
      where: { khatmaId_userId: { khatmaId, userId: targetUserId } },
      data: { status: 'ACTIVE' },
    });

    return { message: 'تم قبول الطلب' };
  }

  async getInvitationByToken(token: string) {
    const inv = await this.db.invitation.findUnique({
      where: { token },
      include: {
        khatma: { select: { id: true, title: true, description: true, type: true, visibility: true, status: true, _count: { select: { participants: true } } } },
        sender: { select: { displayName: true } },
      },
    });
    if (!inv) throw new NotFoundException('الدعوة غير موجودة أو منتهية الصلاحية');
    if (inv.status !== 'PENDING') throw new BadRequestException('تم استخدام هذه الدعوة من قبل');
    if (inv.expiresAt < new Date()) throw new BadRequestException('انتهت صلاحية الدعوة');
    return { khatma: inv.khatma, senderName: inv.sender.displayName, expiresAt: inv.expiresAt };
  }

  async deleteKhatma(userId: string, khatmaId: string) {
    const khatma = await this.db.khatma.findFirst({ where: { id: khatmaId } });
    if (!khatma) throw new NotFoundException('الختمة غير موجودة');
    if (khatma.creatorId !== userId) throw new ForbiddenException('فقط المنشئ يمكنه حذف الختمة');

    const startedCount = await this.db.reservedPart.count({
      where: { khatmaId, status: { in: ['RESERVED', 'COMPLETED'] } },
    });
    if (startedCount > 0) {
      throw new BadRequestException('لا يمكن حذف الختمة بعد بدء القراءة');
    }

    await this.db.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { khatmaId } });
      await tx.notification.deleteMany({ where: { khatmaId } });
      await tx.invitation.deleteMany({ where: { khatmaId } });
      await tx.reservedPart.deleteMany({ where: { khatmaId } });
      await tx.khatma.delete({ where: { id: khatmaId } });
    });

    return { success: true, message: 'تم حذف الختمة نهائياً' };
  }

  async editKhatma(userId: string, khatmaId: string, data: {
    title?: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
  }) {
    const khatma = await this.db.khatma.findFirst({ where: { id: khatmaId, deletedAt: null } });
    if (!khatma) throw new NotFoundException('الختمة غير موجودة');
    if (khatma.creatorId !== userId) throw new ForbiddenException('فقط المنشئ يمكنه تعديل الختمة');

    // Compute effective dates after the update (fall back to current DB values)
    const effectiveStart = 'startDate' in data
      ? (data.startDate ? new Date(data.startDate) : null)
      : khatma.startDate;
    const effectiveEnd = 'endDate' in data
      ? (data.endDate ? new Date(data.endDate) : null)
      : khatma.endDate;

    if (effectiveStart && effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية');
    }

    const updated = await this.db.khatma.update({
      where: { id: khatmaId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...('startDate' in data && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...('endDate' in data && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
    });
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      startDate: updated.startDate,
      endDate: updated.endDate,
    };
  }

  async updateSettings(khatmaId: string, userId: string, settings: {
    allowRepeat?: boolean;
    requireApproval?: boolean;
    isContinuous?: boolean;
    maxMembers?: number | null;
    visibility?: string;
  }) {
    const khatma = await this.db.khatma.findFirst({ where: { id: khatmaId, deletedAt: null } });
    if (!khatma) throw new NotFoundException('الختمة غير موجودة');
    if (khatma.creatorId !== userId) throw new ForbiddenException('فقط المنشئ يمكنه تعديل الإعدادات');

    const updated = await this.db.khatma.update({
      where: { id: khatmaId },
      data: {
        ...(settings.allowRepeat !== undefined && { allowRepeat: settings.allowRepeat }),
        ...(settings.requireApproval !== undefined && { requireApproval: settings.requireApproval }),
        ...(settings.isContinuous !== undefined && { isContinuous: settings.isContinuous }),
        ...('maxMembers' in settings && { maxMembers: settings.maxMembers }),
        ...(settings.visibility !== undefined && { visibility: settings.visibility as any }),
      },
    });

    return { id: updated.id, allowRepeat: updated.allowRepeat, requireApproval: updated.requireApproval, isContinuous: updated.isContinuous, visibility: updated.visibility };
  }

  async createInvitation(khatmaId: string, userId: string, expiresInHours = 48) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const invitation = await this.db.invitation.create({
      data: { senderId: userId, khatmaId, expiresAt },
    });

    return {
      invitationToken: invitation.token,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${invitation.token}`,
      expiresAt: invitation.expiresAt,
    };
  }

  async inviteByEmail(khatmaId: string, userId: string, toEmail: string) {
    const [khatma, sender] = await Promise.all([
      this.db.khatma.findFirst({ where: { id: khatmaId, deletedAt: null } }),
      this.db.user.findUnique({ where: { id: userId }, select: { displayName: true } }),
    ]);
    if (!khatma) throw new NotFoundException('الختمة غير موجودة');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const invitation = await this.db.invitation.create({
      data: { senderId: userId, khatmaId, expiresAt },
    });

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${invitation.token}`;

    return {
      inviteUrl,
      token: invitation.token,
      toEmail,
      senderName: sender?.displayName ?? '',
      khatmaTitle: khatma.title,
    };
  }

  async notifyParticipants(khatmaId: string, ownerId: string) {
    const khatma: any = await this.db.khatma.findFirst({
      where: { id: khatmaId, deletedAt: null },
      include: {
        parts: { select: { status: true } },
        participants: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, displayName: true, email: true } } },
        },
      },
    });
    if (!khatma) throw new NotFoundException('الختمة غير موجودة');

    const ownerParticipant = khatma.participants.find((p: any) => p.userId === ownerId && p.role === 'OWNER');
    if (!ownerParticipant) throw new ForbiddenException('فقط صاحب الختمة يمكنه إرسال الإشعارات');

    const totalParts = khatma.parts.length;
    const remainingParts = khatma.parts.filter((p: any) => p.status === 'AVAILABLE').length;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const khatmaUrl = `${frontendUrl}/khatma/${khatmaId}`;

    // Create a fresh invite link
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invitation = await this.db.invitation.create({
      data: { senderId: ownerId, khatmaId, expiresAt },
    });
    const inviteUrl = `${frontendUrl}/join/${invitation.token}`;

    const others = khatma.participants.filter((p: any) => p.userId !== ownerId);
    let notified = 0;

    for (const p of others) {
      const { user } = p as any;
      if (!user?.email) continue;

      await this.notificationsService.create(
        user.id,
        'DEADLINE_REMINDER',
        `تذكير: ختمة "${khatma.title}"`,
        `${remainingParts} جزء متبقٍ — ${khatma.endDate ? `تنتهي ${new Date(khatma.endDate).toLocaleDateString('ar-SA')}` : 'شارك الرابط مع أصحابك'}`,
        khatmaId,
      );

      this.mail.sendParticipantReminder({
        toEmail: user.email,
        displayName: user.displayName,
        khatmaTitle: khatma.title,
        endDate: khatma.endDate ? new Date(khatma.endDate) : null,
        remainingParts,
        totalParts,
        khatmaUrl,
        inviteUrl,
      }).catch(() => {});

      notified++;
    }

    return {
      success: true,
      notified,
      inviteUrl,
      message: `تم إرسال التذكير لـ ${notified} مشارك`,
    };
  }

  private formatKhatma(k: any) {
    const completedParts = k.parts?.filter((p: any) => p.status === 'COMPLETED').length ?? 0;
    const totalParts = k.totalParts ?? 30;

    return {
      id: k.id,
      title: k.title,
      description: k.description,
      type: k.type,
      status: k.status,
      visibility: k.visibility,
      requireApproval: k.requireApproval,
      allowRepeat: k.allowRepeat,
      isContinuous: k.isContinuous,
      maxMembers: k.maxMembers,
      shareCode: k.shareCode,
      startDate: k.startDate,
      endDate: k.endDate,
      completedAt: k.completedAt,
      iteration: k.iteration,
      totalParts,
      completedParts,
      completionPercentage: Math.round((completedParts / totalParts) * 100),
      participantCount: k._count?.participants ?? k.participants?.length ?? 0,
      creator: k.creator,
      parts: k.parts?.map((p: any) => ({
        id: p.id,
        partNumber: p.partNumber,
        status: p.status,
        reservedBy: p.reservation?.user ?? null,
        completedAt: p.reservation?.completedAt ?? null,
      })),
      participants: k.participants?.map((p: any) => ({
        id: p.id,
        role: p.role,
        status: p.status,
        user: p.user,
      })),
    };
  }
}
