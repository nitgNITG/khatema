import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface CreateAdDto {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  bgColor?: string;
  textColor?: string;
  position?: string;
  status?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdsService {
  constructor(private db: DatabaseService) {}

  /** Public: return active ads for a given position */
  async getActive(position = 'HEADER_BANNER') {
    const now = new Date();
    return this.db.ad.findMany({
      where: {
        position,
        status: 'ACTIVE',
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Public: record an impression (fire-and-forget) */
  async recordImpression(id: string) {
    await this.db.ad.update({ where: { id }, data: { impressions: { increment: 1 } } }).catch(() => {});
  }

  /** Public: record a click */
  async recordClick(id: string) {
    const ad = await this.db.ad.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    await this.db.ad.update({ where: { id }, data: { clickCount: { increment: 1 } } });
    return { success: true, linkUrl: ad.linkUrl };
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  async adminFindAll(page = 1, limit = 20, status?: string, position?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (position) where.position = position;

    const [items, total] = await Promise.all([
      this.db.ad.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.db.ad.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminStats() {
    const [total, active, paused] = await Promise.all([
      this.db.ad.count(),
      this.db.ad.count({ where: { status: 'ACTIVE' } }),
      this.db.ad.count({ where: { status: 'PAUSED' } }),
    ]);

    const agg = await this.db.ad.aggregate({
      _sum: { impressions: true, clickCount: true },
    });

    const totalImpressions = agg._sum.impressions ?? 0;
    const totalClicks = agg._sum.clickCount ?? 0;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return { total, active, paused, totalImpressions, totalClicks, ctr };
  }

  async create(dto: CreateAdDto) {
    return this.db.ad.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        linkText: dto.linkText,
        bgColor: dto.bgColor ?? '#1B6B4A',
        textColor: dto.textColor ?? '#ffffff',
        position: dto.position ?? 'HEADER_BANNER',
        status: dto.status ?? 'ACTIVE',
        priority: dto.priority ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async update(id: string, dto: Partial<CreateAdDto>) {
    const ad = await this.db.ad.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('الإعلان غير موجود');
    return this.db.ad.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      } as any,
    });
  }

  async delete(id: string) {
    await this.db.ad.delete({ where: { id } });
    return { success: true };
  }
}
