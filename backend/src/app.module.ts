import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get('DATABASE_URL');

        if (databaseUrl) {
          console.log('[DB] DATABASE_URL 방식으로 연결');
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
            logging: false,
          };
        }

        console.log('[DB] 개별 환경변수 방식으로 연결');
        return {
          type: 'postgres' as const,
          host: config.get<string>('DATABASE_HOST') || 'localhost',
          port: +(config.get<string>('DATABASE_PORT') || 5432),
          username: config.get<string>('DATABASE_USER') || 'banmo_user',
          password: config.get<string>('DATABASE_PASSWORD') || 'banmo_pass',
          database: config.get<string>('DATABASE_NAME') || 'banmo',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        };
      },
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
