import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { UsersService, UpdateProfileDto } from './users.service';

class AddVideoDto {
  @IsString()
  videoUrl: string;
}

class RemoveVideoDto {
  @IsString()
  videoUrl: string;
}

class UpdateProfileImageDto {
  @IsString()
  imageUrl: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/profile-image')
  @UseGuards(AuthGuard('jwt'))
  updateProfileImage(@Request() req: any, @Body() dto: UpdateProfileImageDto) {
    return this.usersService.updateProfileImage(req.user.id, dto.imageUrl);
  }

  @Post('me/videos')
  @UseGuards(AuthGuard('jwt'))
  addVideo(@Request() req: any, @Body() dto: AddVideoDto) {
    return this.usersService.addVideo(req.user.id, dto.videoUrl);
  }

  @Delete('me/videos')
  @UseGuards(AuthGuard('jwt'))
  removeVideo(@Request() req: any, @Body() dto: RemoveVideoDto) {
    return this.usersService.removeVideo(req.user.id, dto.videoUrl);
  }
}
