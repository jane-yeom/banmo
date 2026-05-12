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
  Req,
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
    return this.usersService.getPublicProfile(id, 'public');
  }

  @Get(':id/full')
  @UseGuards(AuthGuard('jwt'))
  getFullProfile(@Param('id') id: string) {
    return this.usersService.getFullProfile(id);
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

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }

  @Post('block/:userId')
  @UseGuards(AuthGuard('jwt'))
  async blockUser(@Param('userId') userId: string, @Request() req: any) {
    return this.usersService.blockUser(req.user.id, userId);
  }

  @Delete('block/:userId')
  @UseGuards(AuthGuard('jwt'))
  async unblockUser(@Param('userId') userId: string, @Request() req: any) {
    return this.usersService.unblockUser(req.user.id, userId);
  }

  @Get('block/list')
  @UseGuards(AuthGuard('jwt'))
  async getBlockList(@Request() req: any) {
    return this.usersService.getBlockList(req.user.id);
  }
}
