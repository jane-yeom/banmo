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
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  findAll(
    @Query('type') type?: BoardType,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.boardService.findAll({ type, tag, sort, page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }

  @Get('hot')
  getHot() {
    return this.boardService.getHotBoards();
  }

  @Get('tags/popular')
  getPopularTags() {
    return this.boardService.getPopularTags();
  }

  @Get('tags/search')
  searchTags(@Query('q') q: string) {
    return this.boardService.searchTags(q);
  }

  @Get('tags/:tag')
  getBoardsByTag(
    @Param('tag') tag: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.boardService.getBoardsByTag(tag, +page, +limit);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.boardService.findOne(id, user?.id);
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

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  like(@CurrentUser() user: User, @Param('id') id: string) {
    return this.boardService.likeBoard(id, user.id);
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
