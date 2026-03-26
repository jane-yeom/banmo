import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BoardType } from './board.entity';

export class CreateBoardDto {
  @IsEnum(BoardType)
  type: BoardType;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
