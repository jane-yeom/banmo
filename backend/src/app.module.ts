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
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: +config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
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
