import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { IsOptional, IsString, IsUUID } from 'class-validator';

class CreateRoomDto {
  @IsUUID()
  receiverId: string;

  @IsOptional()
  @IsString()
  postId?: string;
}

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  createRoom(@CurrentUser() user: User, @Body() dto: CreateRoomDto) {
    return this.chatService.createRoom(user.id, dto.receiverId, dto.postId);
  }

  @Get('rooms')
  getMyRooms(@CurrentUser() user: User) {
    return this.chatService.getMyRooms(user.id);
  }

  @Get('rooms/:id/messages')
  getMessages(@CurrentUser() user: User, @Param('id') id: string) {
    return this.chatService.getMessages(user.id, id);
  }
}
