import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const VIDEO_EXTS = ['mp4', 'mov', 'avi'];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;   // 10 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;  // 500 MB
const PRESIGNED_EXPIRES = 600; // 10분

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = config.get<string>('AWS_REGION') ?? 'ap-northeast-2';
    this.bucket = config.get<string>('AWS_S3_BUCKET') ?? 'banmo-media';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async getPresignedUrl(
    fileName: string,
    fileType: 'image' | 'video',
  ): Promise<{ uploadUrl: string; fileUrl: string; maxBytes: number }> {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

    if (fileType === 'image') {
      if (!IMAGE_EXTS.includes(ext)) {
        throw new BadRequestException(
          `허용되지 않는 이미지 형식입니다. (허용: ${IMAGE_EXTS.join(', ')})`,
        );
      }
    } else {
      if (!VIDEO_EXTS.includes(ext)) {
        throw new BadRequestException(
          `허용되지 않는 동영상 형식입니다. (허용: ${VIDEO_EXTS.join(', ')})`,
        );
      }
    }

    const maxBytes = fileType === 'image' ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
    const folder = fileType === 'image' ? 'images' : 'videos';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: this.getMimeType(ext),
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGNED_EXPIRES,
    });

    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return { uploadUrl, fileUrl, maxBytes };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // fileUrl: https://bucket.s3.region.amazonaws.com/key
    const url = new URL(fileUrl);
    const key = url.pathname.slice(1); // remove leading /
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
