import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getMyFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getMyFavorites(user.id);
  }

  @Post()
  addFavorite(@CurrentUser() user: User, @Body() body: { postId: string }) {
    return this.favoritesService.addFavorite(user.id, body.postId);
  }

  @Delete(':postId')
  removeFavorite(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.favoritesService.removeFavorite(user.id, postId);
  }

  @Get(':postId/check')
  checkFavorite(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.favoritesService.checkFavorite(user.id, postId);
  }
}
