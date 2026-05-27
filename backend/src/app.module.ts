import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chat/chat.module';
import { BoardModule } from './board/board.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { ApplicationsModule } from './applications/applications.module';
import { PaymentsModule } from './payments/payments.module';
import { QnaModule } from './qna/qna.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProd ? '.env' : '.env.development',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: !isProd,
        logging: !isProd,
        ssl: isProd ? { rejectUnauthorized: false } : false,
      }),
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    ChatModule,
    BoardModule,
    ReportsModule,
    AdminModule,
    MediaModule,
    ApplicationsModule,
    PaymentsModule,
    QnaModule,
    NotificationsModule,
    FavoritesModule,
  ],
})
export class AppModule {}
