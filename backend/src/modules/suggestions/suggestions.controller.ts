import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, Optional,
} from '@nestjs/common';
import { SuggestionsService, CreateSuggestionDto } from './suggestions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller()
export class SuggestionsController {
  constructor(private readonly service: SuggestionsService) {}

  // ── Public: anyone can submit ─────────────────────────────────────────
  @Post('suggestions')
  async create(@Body() dto: CreateSuggestionDto, @Request() req: any) {
    const userId = req.user?.id ?? undefined;
    return this.service.create(dto, userId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/suggestions')
  adminList(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.service.adminFindAll(+page, +limit, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/suggestions/:id')
  adminUpdate(@Param('id') id: string, @Body() body: { status?: string; adminNote?: string }) {
    return this.service.adminUpdate(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/suggestions/:id')
  adminDelete(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }
}
