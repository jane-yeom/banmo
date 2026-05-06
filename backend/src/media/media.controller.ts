import {
  Controller,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'uploads',
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    const result = await this.mediaService.uploadFile(file, folder);
    return { success: true, data: result };
  }

  @Post('presigned-url')
  async getPresignedUrl(
    @Body() body: { fileName: string; fileType: string; folder?: string },
  ) {
    const result = await this.mediaService.getPresignedUrl(
      body.fileName,
      body.fileType,
      body.folder || 'uploads',
    );
    return { success: true, data: result };
  }

  @Delete('file')
  async deleteFile(@Body('key') key: string) {
    await this.mediaService.deleteFile(key);
    return { success: true };
  }
}
