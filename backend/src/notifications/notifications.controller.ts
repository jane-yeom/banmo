import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMyNotifications(@CurrentUser() user: User) {
    return this.notificationsService.getMyNotifications(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Delete(':id')
  deleteNotification(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(user.id, id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.notificationsService.getSetting(user.id);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: User, @Body() body: Record<string, any>) {
    return this.notificationsService.updateSetting(user.id, body);
  }

  @Post('fcm-token')
  saveFcmToken(@CurrentUser() user: User, @Body() body: { token: string }) {
    return this.notificationsService.saveFcmToken(user.id, body.token);
  }
}
