import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Block } from './block.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TrustService } from './trust.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block]), forwardRef(() => NotificationsModule)],
  providers: [UsersService, TrustService],
  controllers: [UsersController],
  exports: [UsersService, TrustService],
})
export class UsersModule {}
