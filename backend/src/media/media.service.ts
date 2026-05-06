import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; key: string }> {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다');
    }

    const isVideo = allowedVideoTypes.includes(file.mimetype);

    if (isVideo && file.size > 500 * 1024 * 1024) {
      throw new BadRequestException('영상은 500MB 이하만 가능합니다');
    }
    if (!isVideo && file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('이미지는 10MB 이하만 가능합니다');
    }

    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    const bucket = this.configService.get('R2_BUCKET_NAME');
    const publicUrl = this.configService.get('R2_PUBLIC_URL');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `${publicUrl}/${key}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const bucket = this.configService.get('R2_BUCKET_NAME');
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async getPresignedUrl(
    fileName: string,
    fileType: string,
    folder: string = 'uploads',
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const ext = fileName.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    const bucket = this.configService.get('R2_BUCKET_NAME');
    const publicUrl = this.configService.get('R2_PUBLIC_URL');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 600 });

    return {
      uploadUrl,
      fileUrl: `${publicUrl}/${key}`,
      key,
    };
  }
}
