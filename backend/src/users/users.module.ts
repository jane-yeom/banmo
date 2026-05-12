import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Block } from './block.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block])],
  providers: [UsersService, TrustService],
  controllers: [UsersController],
  exports: [UsersService, TrustService],
})
export class UsersModule {}
