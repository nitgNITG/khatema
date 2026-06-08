import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AdsService, CreateAdDto } from './ads.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller()
export class AdsController {
  constructor(private readonly service: AdsService) {}

  // ── Public ────────────────────────────────────────────────────────────

  @Get('ads')
  getActive(@Query('position') position = 'HEADER_BANNER') {
    return this.service.getActive(position);
  }

  @Post('ads/:id/impression')
  recordImpression(@Param('id') id: string) {
    return this.service.recordImpression(id);
  }

  @Post('ads/:id/click')
  recordClick(@Param('id') id: string) {
    return this.service.recordClick(id);
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/ads/stats')
  adminStats() {
    return this.service.adminStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/ads')
  adminList(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('position') position?: string,
  ) {
    return this.service.adminFindAll(+page, +limit, status, position);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/ads')
  create(@Body() dto: CreateAdDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/ads/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAdDto>) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/ads/:id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
