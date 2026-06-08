import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ArticlesService, CreateArticleDto } from './articles.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller()
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  // ── Public endpoints ──────────────────────────────────────────────────

  @Get('articles')
  list(@Query('page') page = '1', @Query('limit') limit = '10', @Query('lang') lang = 'ar') {
    return this.service.findAll(+page, +limit, lang as 'ar' | 'en');
  }

  @Get('articles/:slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/articles')
  adminList(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.service.adminFindAll(+page, +limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/articles')
  create(@Body() dto: CreateArticleDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/articles/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateArticleDto>) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/articles/:id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('admin/articles/generate')
  generate(@Body('count') count = 5, @Request() req: any) {
    return this.service.generateArticles(+count, req.user.id);
  }
}
