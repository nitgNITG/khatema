import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface CreateSuggestionDto {
  content: string;
  name?: string;
  email?: string;
}

@Injectable()
export class SuggestionsService {
  constructor(private db: DatabaseService) {}

  async create(dto: CreateSuggestionDto, userId?: string) {
    return this.db.suggestion.create({
      data: {
        content: dto.content,
        name: dto.name,
        email: dto.email,
        userId: userId ?? null,
      },
    });
  }

  async adminFindAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.db.suggestion.count({ where }),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminUpdate(id: string, data: { status?: string; adminNote?: string }) {
    const suggestion = await this.db.suggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('الاقتراح غير موجود');
    return this.db.suggestion.update({ where: { id }, data: data as any });
  }

  async adminDelete(id: string) {
    await this.db.suggestion.delete({ where: { id } });
    return { success: true };
  }
}
