import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './post.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() filter: PostFilterDto) {
    return this.postsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post('test')
  async testCreate(@Body() body: any) {
    return { success: true, received: body };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
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
