import { Controller, Delete, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notifications.getNotifications(user.id, +page, +limit);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }

  @Delete('read')
  deleteRead(@CurrentUser() user: any) {
    return this.notifications.deleteReadNotifications(user.id);
  }
}
