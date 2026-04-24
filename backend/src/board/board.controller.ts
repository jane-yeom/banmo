import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BoardService } from './board.service';
import { CreateBoardDto, CreateCommentDto } from './board.dto';
import { BoardType } from './board.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  findAll(@Query('type') type?: BoardType) {
    return this.boardService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser() user: User, @Body() dto: CreateBoardDto) {
    return this.boardService.create(user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.boardService.delete(user.id, user.role, id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  addComment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.boardService.addComment(user.id, id, dto);
  }

  @Delete(':boardId/comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  deleteComment(
    @CurrentUser() user: User,
    @Param('boardId') boardId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.boardService.deleteComment(boardId, commentId, user.id, user.role);
  }
}
