import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';

export interface CreateArticleDto {
  slug?: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  excerptAr?: string;
  excerptEn?: string;
  tags?: string;
  metaDescAr?: string;
  metaDescEn?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
}

@Injectable()
export class ArticlesService {
  private anthropic: Anthropic | null = null;

  constructor(private db: DatabaseService, private config: ConfigService) {
    const key = this.config.get<string>('ANTHROPIC_API_KEY');
    if (key && key !== 'your_anthropic_api_key_here') {
      this.anthropic = new Anthropic({ apiKey: key });
    }
  }

  /** Slugify Arabic/English title */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `article-${Date.now()}`;
  }

  // ── Public ──────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 10, lang: 'ar' | 'en' = 'ar') {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.article.findMany({
        where: { status: 'PUBLISHED' },
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, slug: true, titleAr: true, titleEn: true,
          excerptAr: true, excerptEn: true, coverImage: true,
          tags: true, viewCount: true, publishedAt: true, createdAt: true,
        },
      }),
      this.db.article.count({ where: { status: 'PUBLISHED' } }),
    ]);
    return {
      items,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async findBySlug(slug: string) {
    const article = await this.db.article.findUnique({ where: { slug } });
    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('المقال غير موجود');
    }
    // Increment view count (fire-and-forget)
    this.db.article.update({ where: { slug }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return article;
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async adminFindAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.article.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, slug: true, titleAr: true, titleEn: true,
          status: true, viewCount: true, publishedAt: true, createdAt: true, tags: true,
        },
      }),
      this.db.article.count(),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateArticleDto, authorId: string) {
    const slug = dto.slug || this.slugify(dto.titleEn || dto.titleAr);
    // Ensure slug unique
    const existing = await this.db.article.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    return this.db.article.create({
      data: {
        slug: finalSlug,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        contentAr: dto.contentAr,
        contentEn: dto.contentEn,
        excerptAr: dto.excerptAr,
        excerptEn: dto.excerptEn,
        tags: dto.tags,
        metaDescAr: dto.metaDescAr,
        metaDescEn: dto.metaDescEn,
        status: dto.status ?? 'DRAFT',
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
        authorId,
      },
    });
  }

  async update(id: string, dto: Partial<CreateArticleDto>) {
    const article = await this.db.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('المقال غير موجود');
    const wasPublished = article.status !== 'PUBLISHED' && dto.status === 'PUBLISHED';
    return this.db.article.update({
      where: { id },
      data: {
        ...dto,
        publishedAt: wasPublished ? new Date() : article.publishedAt,
      } as any,
    });
  }

  async delete(id: string) {
    await this.db.article.delete({ where: { id } });
    return { success: true };
  }

  // ── AI Generation ────────────────────────────────────────────────────────

  async generateArticles(count: number, authorId: string) {
    if (!this.anthropic) {
      throw new BadRequestException(
        'يجب تعيين ANTHROPIC_API_KEY في ملف .env لاستخدام ميزة التوليد التلقائي',
      );
    }

    const topics = [
      'فضل ختم القرآن الكريم وأجره العظيم',
      'كيف تنظم ختمة جماعية ناجحة مع عائلتك',
      'أثر قراءة القرآن في تصفية القلب وطمأنينة النفس',
      'ختم القرآن في رمضان: فضله وأفضل طريقة',
      'العمل الصالح في الإسلام: أنواعه وفضله',
      'الذكر والتلاوة اليومية: روتين روحي يغير حياتك',
      'التعاون على البر: فضل الأعمال الجماعية في الإسلام',
      'خطوات لتحفيز الأسرة على إتمام ختمات قرآنية منتظمة',
      'ثمرات تلاوة القرآن: فوائد دنيوية وأخروية',
      'كيف تجعل القرآن رفيقاً يومياً في حياتك',
    ];

    const selectedTopics = topics.slice(0, Math.min(count, topics.length));
    const results: any[] = [];

    for (const topic of selectedTopics) {
      try {
        const message = await this.anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `أنت كاتب محتوى إسلامي متخصص. اكتب مقالاً عن الموضوع التالي لموقع "ختمة" (منصة لختم القرآن الجماعي).

الموضوع: ${topic}

اكتب المقال بصيغة JSON فقط بدون أي نص خارجه:
{
  "titleAr": "عنوان المقال بالعربية",
  "titleEn": "Article title in English",
  "excerptAr": "ملخص المقال بالعربية (2-3 جمل)",
  "excerptEn": "Article summary in English (2-3 sentences)",
  "contentAr": "محتوى المقال الكامل بالعربية (400-600 كلمة) بصيغة HTML بسيطة <p> <h2> <ul> <li>",
  "contentEn": "Full article content in English (400-600 words) in simple HTML format <p> <h2> <ul> <li>",
  "metaDescAr": "وصف SEO بالعربية (150 حرف)",
  "metaDescEn": "SEO description in English (150 chars)",
  "tags": "قرآن,ختمة,إسلام,أعمال صالحة"
}`,
            },
          ],
        });

        const text = (message.content[0] as any)?.text ?? '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const data = JSON.parse(jsonMatch[0]);
        const article = await this.create(
          { ...data, status: 'PUBLISHED' },
          authorId,
        );
        results.push(article);
      } catch (err) {
        console.error('Article generation error for topic:', topic, err);
      }
    }

    return { generated: results.length, articles: results };
  }
}
