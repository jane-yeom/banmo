import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { Keyword } from './keyword.entity';
import { NotificationSetting } from './notification-setting.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { KeywordsController } from './keywords.controller';
import { FcmService } from './fcm.service';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Keyword, NotificationSetting, User]),
  ],
  providers: [NotificationsService, FcmService],
  controllers: [NotificationsController, KeywordsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
