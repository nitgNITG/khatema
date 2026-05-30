import { Controller, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private admin: AdminService) {}

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
