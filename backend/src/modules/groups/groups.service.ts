import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private db: DatabaseService) {}

  // ── List public groups ──────────────────────────────────────────────
  async findAll(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const q = query.q?.trim() || '';

    const where: any = {
      deletedAt: null,
      visibility: 'PUBLIC',
      ...(q && { name: { contains: q } }),
    };

    const [items, total] = await Promise.all([
      this.db.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, displayName: true, avatarUrl: true } },
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
        },
      }),
      this.db.group.count({ where }),
    ]);

    return {
      items: items.map((g) => ({
        ...g,
        memberCount: (g as any)._count.members,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── My groups ───────────────────────────────────────────────────────
  async findMyGroups(userId: string) {
    const memberships = await this.db.groupMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        group: {
          include: {
            creator: { select: { id: true, displayName: true, avatarUrl: true } },
            _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships
      .filter((m) => !m.group.deletedAt)
      .map((m) => ({
        ...m.group,
        memberCount: (m.group as any)._count.members,
        myRole: m.role,
        _count: undefined,
      }));
  }

  // ── Get one group ───────────────────────────────────────────────────
  async findById(groupId: string, userId?: string) {
    const group = await this.db.group.findFirst({
      where: { id: groupId, deletedAt: null },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
        members: {
          where: { status: 'ACTIVE' },
          orderBy: { joinedAt: 'asc' },
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
        khatmas: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            totalParts: true,
            createdAt: true,
            _count: { select: { participants: { where: { status: 'ACTIVE' } }, parts: { where: { status: 'COMPLETED' } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!group) throw new NotFoundException('المجموعة غير موجودة');

    // Private/invite-only: must be a member to view
    const g = group as any;
    if (group.visibility !== 'PUBLIC' && userId) {
      const isMember = g.members.some((m: any) => m.userId === userId);
      if (!isMember) throw new ForbiddenException('هذه المجموعة خاصة');
    } else if (group.visibility !== 'PUBLIC' && !userId) {
      throw new ForbiddenException('هذه المجموعة خاصة');
    }

    const myMembership = userId
      ? g.members.find((m: any) => m.userId === userId)
      : null;

    const khatmasWithStats = (g.khatmas ?? []).map((k: any) => ({
      id: k.id,
      title: k.title,
      status: k.status,
      createdAt: k.createdAt,
      participantCount: k._count?.participants ?? 0,
      completionPercentage: k.totalParts > 0
        ? Math.round(((k._count?.parts ?? 0) / k.totalParts) * 100)
        : 0,
    }));

    return {
      ...group,
      memberCount: g._count.members,
      myRole: myMembership?.role ?? null,
      isMember: !!myMembership,
      khatmas: khatmasWithStats,
      _count: undefined,
    };
  }

  // ── Create group ────────────────────────────────────────────────────
  async create(userId: string, dto: CreateGroupDto) {
    const group = await this.db.group.create({
      data: {
        creatorId: userId,
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility ?? 'PUBLIC',
        requireApproval: dto.requireApproval ?? false,
        maxMembers: dto.maxMembers,
        members: {
          create: { userId, role: 'OWNER', status: 'ACTIVE' },
        },
      },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      },
    });

    return { ...group, memberCount: (group as any)._count.members, _count: undefined };
  }

  // ── Update group ────────────────────────────────────────────────────
  async update(groupId: string, userId: string, dto: UpdateGroupDto) {
    const group = await this.db.group.findFirst({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');
    if (group.creatorId !== userId) throw new ForbiddenException('فقط المنشئ يمكنه تعديل المجموعة');

    return this.db.group.update({ where: { id: groupId }, data: dto });
  }

  // ── Delete group ────────────────────────────────────────────────────
  async delete(groupId: string, userId: string) {
    const group = await this.db.group.findFirst({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');
    if (group.creatorId !== userId) throw new ForbiddenException('فقط المنشئ يمكنه حذف المجموعة');

    await this.db.group.update({ where: { id: groupId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ── Join by invite code ─────────────────────────────────────────────
  async joinByCode(inviteCode: string, userId: string) {
    const group = await this.db.group.findFirst({ where: { inviteCode, deletedAt: null } });
    if (!group) throw new NotFoundException('رمز الدعوة غير صحيح');

    const existing = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') throw new ConflictException('أنت بالفعل عضو في هذه المجموعة');
      // Re-activate if left
      await this.db.groupMember.update({
        where: { id: existing.id },
        data: { status: group.requireApproval ? 'PENDING' : 'ACTIVE', leftAt: null },
      });
      return { status: group.requireApproval ? 'PENDING' : 'ACTIVE', group };
    }

    // Check max members
    if (group.maxMembers) {
      const count = await this.db.groupMember.count({ where: { groupId: group.id, status: 'ACTIVE' } });
      if (count >= group.maxMembers) throw new BadRequestException('المجموعة ممتلئة');
    }

    const status = group.requireApproval ? 'PENDING' : 'ACTIVE';
    await this.db.groupMember.create({ data: { groupId: group.id, userId, role: 'MEMBER', status } });

    return { status, group };
  }

  // ── Join public group ───────────────────────────────────────────────
  async join(groupId: string, userId: string) {
    const group = await this.db.group.findFirst({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');
    if (group.visibility === 'INVITE_ONLY') throw new ForbiddenException('هذه المجموعة بالدعوة فقط');

    const existing = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing?.status === 'ACTIVE') throw new ConflictException('أنت بالفعل عضو');

    if (existing) {
      await this.db.groupMember.update({
        where: { id: existing.id },
        data: { status: group.requireApproval ? 'PENDING' : 'ACTIVE', leftAt: null },
      });
    } else {
      if (group.maxMembers) {
        const count = await this.db.groupMember.count({ where: { groupId, status: 'ACTIVE' } });
        if (count >= group.maxMembers) throw new BadRequestException('المجموعة ممتلئة');
      }
      await this.db.groupMember.create({
        data: { groupId, userId, role: 'MEMBER', status: group.requireApproval ? 'PENDING' : 'ACTIVE' },
      });
    }

    return { status: group.requireApproval ? 'PENDING' : 'ACTIVE' };
  }

  // ── Leave group ─────────────────────────────────────────────────────
  async leave(groupId: string, userId: string) {
    const member = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') throw new NotFoundException('لست عضواً في هذه المجموعة');
    if (member.role === 'OWNER') throw new BadRequestException('لا يمكن للمنشئ مغادرة المجموعة، يمكنك حذفها بدلاً من ذلك');

    await this.db.groupMember.update({
      where: { id: member.id },
      data: { status: 'ACTIVE', leftAt: new Date() },
    });
    // soft-delete membership
    await this.db.groupMember.delete({ where: { id: member.id } });
    return { success: true };
  }

  // ── Approve/reject pending member (admin/owner) ─────────────────────
  async approveMember(groupId: string, targetUserId: string, requesterId: string, approve: boolean) {
    const myMembership = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (!myMembership || !['OWNER', 'ADMIN'].includes(myMembership.role)) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }

    const target = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target || target.status !== 'PENDING') throw new NotFoundException('لا يوجد طلب انضمام معلق');

    if (approve) {
      await this.db.groupMember.update({ where: { id: target.id }, data: { status: 'ACTIVE' } });
    } else {
      await this.db.groupMember.delete({ where: { id: target.id } });
    }

    return { success: true };
  }

  // ── Remove member (admin/owner) ─────────────────────────────────────
  async removeMember(groupId: string, targetUserId: string, requesterId: string) {
    const myMembership = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (!myMembership || !['OWNER', 'ADMIN'].includes(myMembership.role)) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }

    const target = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('المستخدم ليس عضواً');
    if (target.role === 'OWNER') throw new ForbiddenException('لا يمكن إزالة المنشئ');

    await this.db.groupMember.delete({ where: { id: target.id } });
    return { success: true };
  }

  // ── Get invite code (owner/admin only) ──────────────────────────────
  async getInviteCode(groupId: string, userId: string) {
    const member = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('ليس لديك صلاحية الاطلاع على رمز الدعوة');
    }
    const group = await this.db.group.findFirst({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new NotFoundException('المجموعة غير موجودة');
    return { inviteCode: group.inviteCode };
  }
}
