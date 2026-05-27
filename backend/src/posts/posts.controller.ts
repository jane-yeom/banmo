import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './post.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() filter: PostFilterDto) {
    return this.postsService.findAll(filter);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.postsService.findOne(id, user?.id);
  }

  @Post('test')
  async testCreate(@Body() body: any) {
    return { success: true, received: body };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    console.log('[Posts] 글 등록 요청 받음', user.id, dto);
    return this.postsService.create(user.id, dto);
  }

  @Patch(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  completePost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.completePost(id, req.user.id);
  }

  @Patch(':id/close')
  @UseGuards(AuthGuard('jwt'))
  closePost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.closePost(id, req.user.id);
  }

  @Patch(':id/reopen')
  @UseGuards(AuthGuard('jwt'))
  reopenPost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.reopenPost(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.postsService.delete(user.id, id);
  }
}
