import { Controller, Get, Patch, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

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

  @Patch('me/limits')
  updateLimits(
    @CurrentUser() user: any,
    @Body() body: { maxCollectiveKhatmas?: number; maxIndividualKhatmas?: number },
  ) {
    return this.users.updateLimits(user.id, body);
  }

  @Patch('me/notifications')
  updateNotifications(
    @CurrentUser() user: any,
    @Body() body: { notifyBeforeHours: number[] },
  ) {
    return this.users.updateNotificationPrefs(user.id, body.notifyBeforeHours);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.users.uploadAvatar(user.id, file);
  }

  @Get('me/khatmas')
  getMyKhatmas(@CurrentUser() user: any) {
    return this.users.getMyKhatmas(user.id);
  }
}
