import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() body: { displayName?: string; avatarUrl?: string }) {
    return this.users.updateProfile(user.id, body);
  }

  @Get('me/khatmas')
  getMyKhatmas(@CurrentUser() user: any) {
    return this.users.getMyKhatmas(user.id);
  }
}
