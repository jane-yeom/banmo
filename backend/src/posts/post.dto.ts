import {
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostCategory, PayType, PostStatus } from './post.entity';

export class CreatePostDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  content: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instruments?: string[];

  @IsOptional()
  @IsString()
  region?: string;

  @IsEnum(PayType)
  payType: PayType;

  @IsInt()
  @Min(0)
  payMin: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  payMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instruments?: string[];

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(PayType)
  payType?: PayType;

  @IsOptional()
  @IsInt()
  @Min(0)
  payMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  payMax?: number;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class PostFilterDto {
  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @IsOptional()
  @IsString()
  instrument?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
