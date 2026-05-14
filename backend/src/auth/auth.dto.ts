import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4, { message: '아이디는 최소 4자 이상이어야 합니다.' })
  @MaxLength(20, { message: '아이디는 최대 20자까지 가능합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '아이디는 영문, 숫자, _(밑줄)만 사용 가능합니다.' })
  username: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  nickname: string;

  @IsArray()
  @IsOptional()
  instruments?: string[];
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;
}
