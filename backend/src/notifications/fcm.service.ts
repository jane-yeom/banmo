import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app: any = null;

  constructor(private readonly configService: ConfigService) {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn('Firebase credentials not configured. FCM push disabled.');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        });
      } else {
        this.app = admin.apps[0];
      }
      this.logger.log('Firebase Admin initialized.');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin:', err);
    }
  }

  async sendToDevice(
    token: string,
    notification: { title: string; body: string; link?: string },
  ): Promise<boolean> {
    if (!this.app) return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin');
      await admin.messaging().send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          fcmOptions: {
            link: notification.link,
          },
        },
      });
      return true;
    } catch (err: any) {
      if (
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(`Expired FCM token: ${token}`);
        return false; // 호출자가 토큰 삭제 처리
      }
      this.logger.error('FCM send error:', err);
      return false;
    }
  }
}
