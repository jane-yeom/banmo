import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';

class PresignedUrlDto {
  fileName: string;
  fileType: 'image' | 'video';
}

class DeleteFileDto {
  fileUrl: string;
}

@Controller('media')
@UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.mediaService.getPresignedUrl(dto.fileName, dto.fileType);
  }

  @Delete('file')
  deleteFile(@Body() dto: DeleteFileDto) {
    return this.mediaService.deleteFile(dto.fileUrl);
  }
}
