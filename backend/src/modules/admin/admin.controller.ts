import { Controller, Delete, Get, Patch, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('settings')
  @HttpCode(HttpStatus.OK)
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch('settings')
  @HttpCode(HttpStatus.OK)
  updateSettings(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.admin.updateSettings(body, user.id);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.admin.getStats();
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.admin.getUsers(parseInt(page, 10), parseInt(limit, 10), search);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.admin.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  @Delete('reset/khatmas')
  @HttpCode(HttpStatus.OK)
  resetKhatmas() {
    return this.admin.resetKhatmas();
  }

  @Delete('reset/all')
  @HttpCode(HttpStatus.OK)
  resetAll() {
    return this.admin.resetAll();
  }
}
