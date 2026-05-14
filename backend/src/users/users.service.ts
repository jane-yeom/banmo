import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, LoginType, NoteGrade } from './user.entity';
import { Block } from './block.entity';

function calcGrade(score: number): NoteGrade {
  if (score >= 100) return NoteGrade.WHOLE;
  if (score >= 60)  return NoteGrade.HALF;
  if (score >= 30)  return NoteGrade.QUARTER;
  if (score >= 10)  return NoteGrade.EIGHTH;
  return NoteGrade.SIXTEENTH;
}

const MAX_VIDEOS = 5;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instruments?: string[];

  @IsOptional()
  isBioPublic?: boolean;

  @IsOptional()
  isCareerPublic?: boolean;

  @IsOptional()
  isAttachmentPublic?: boolean;

  @IsOptional()
  isInstrumentsPublic?: boolean;

  @IsOptional()
  isRegionPublic?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { kakaoId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } as any });
  }

  async createEmailUser(data: {
    username?: string;
    email: string;
    password: string;
    nickname: string;
    instruments?: string[];
  }): Promise<User> {
    const user = this.usersRepository.create({
      username: data.username ?? null,
      email: data.email,
      password: data.password,
      nickname: data.nickname,
      instruments: data.instruments ?? [],
      loginType: LoginType.EMAIL,
    } as unknown as User);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createKakaoUser(data: {
    kakaoId: string;
    nickname?: string;
    kakaoNickname?: string;
    kakaoEmail?: string;
    kakaoProfileImage?: string;
    email?: string;
    profileImage?: string;
  }): Promise<User> {
    const partial: Partial<User> = {
      kakaoId: data.kakaoId,
      nickname: data.nickname ?? undefined,
      kakaoNickname: data.kakaoNickname ?? undefined,
      kakaoEmail: data.kakaoEmail ?? undefined,
      kakaoProfileImage: data.kakaoProfileImage ?? undefined,
      email: data.email ?? undefined,
      profileImage: data.profileImage ?? undefined,
      loginType: LoginType.KAKAO,
    };
    const user = this.usersRepository.create(partial as User);
    return this.usersRepository.save(user);
  }

  async updateTrustScore(id: string, delta: number): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    const oldGrade = user.noteGrade;
    user.trustScore = Math.max(0, user.trustScore + delta);
    user.noteGrade = calcGrade(user.trustScore);
    if (user.noteGrade !== oldGrade) {
      // grade changed
    }
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.career !== undefined) (user as any).career = dto.career;
    if (dto.attachmentUrl !== undefined) (user as any).attachmentUrl = dto.attachmentUrl;
    if (dto.attachmentName !== undefined) (user as any).attachmentName = dto.attachmentName;
    if (dto.region !== undefined) user.region = dto.region;
    if (dto.instruments !== undefined) user.instruments = dto.instruments;
    if (dto.isBioPublic !== undefined) (user as any).isBioPublic = dto.isBioPublic;
    if (dto.isCareerPublic !== undefined) (user as any).isCareerPublic = dto.isCareerPublic;
    if (dto.isAttachmentPublic !== undefined) (user as any).isAttachmentPublic = dto.isAttachmentPublic;
    if (dto.isInstrumentsPublic !== undefined) (user as any).isInstrumentsPublic = dto.isInstrumentsPublic;
    if (dto.isRegionPublic !== undefined) (user as any).isRegionPublic = dto.isRegionPublic;
    return this.usersRepository.save(user);
  }

  async updateProfileImage(id: string, imageUrl: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    user.profileImage = imageUrl;
    return this.usersRepository.save(user);
  }

  async addVideo(id: string, videoUrl: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    const current = (user.videoUrls ?? []).filter(Boolean);
    if (current.length >= MAX_VIDEOS) {
      throw new BadRequestException(`연주 영상은 최대 ${MAX_VIDEOS}개까지 등록할 수 있습니다.`);
    }
    user.videoUrls = [...current, videoUrl];
    return this.usersRepository.save(user);
  }

  async removeVideo(id: string, videoUrl: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    user.videoUrls = (user.videoUrls ?? []).filter((v) => v !== videoUrl);
    return this.usersRepository.save(user);
  }

  async getPublicProfile(id: string, viewerType: 'public' | 'owner' | 'recruiter' = 'public'): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { kakaoId, email, isBanned, password, sanitizeArrays, ...profile } = user as any;

    if (viewerType === 'owner' || viewerType === 'recruiter') {
      return profile;
    }

    // 일반 공개 조회: 비공개 필드 마스킹
    if (!profile.isBioPublic) profile.bio = null;
    if (!profile.isCareerPublic) { profile.career = null; }
    if (!profile.isAttachmentPublic) { profile.attachmentUrl = null; profile.attachmentName = null; }
    if (!profile.isInstrumentsPublic) profile.instruments = [];
    if (!profile.isRegionPublic) profile.region = null;

    return profile;
  }

  async getFullProfile(id: string): Promise<Partial<User>> {
    return this.getPublicProfile(id, 'recruiter');
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('자기 자신을 차단할 수 없습니다');
    }
    const existing = await this.blockRepository.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });
    if (existing) throw new BadRequestException('이미 차단된 유저입니다');
    const block = this.blockRepository.create({
      blocker: { id: blockerId } as User,
      blocked: { id: blockedId } as User,
    });
    await this.blockRepository.save(block);
    return { success: true, message: '차단되었습니다' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.blockRepository.delete({
      blocker: { id: blockerId },
      blocked: { id: blockedId },
    });
    return { success: true, message: '차단이 해제되었습니다' };
  }

  async getBlockList(userId: string) {
    return this.blockRepository.find({
      where: { blocker: { id: userId } },
      relations: ['blocked'],
    });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });
    return !!block;
  }

  async saveResetToken(userId: string, token: string, expires: Date) {
    await this.usersRepository.update(userId, {
      resetToken: token,
      resetTokenExpires: expires,
    } as any);
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { nickname } });
  }

  async findByEmailVerifyToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerifyToken: token } as any });
  }

  async verifyEmailUser(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    } as any);
  }

  async updateVerifyToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerifyToken: token,
      emailVerifyExpires: expires,
    } as any);
  }

  async findByResetToken(token: string) {
    return this.usersRepository.findOne({ where: { resetToken: token } as any });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await this.usersRepository.update(userId, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    } as any);
  }

  async deleteAccount(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    const u = user as any;
    u.deletedAt = new Date();
    u.nickname = '탈퇴한 회원';
    u.email = null;
    u.kakaoId = `deleted_${userId}`;
    u.profileImage = null;
    u.bio = null;
    u.isBanned = true;

    await this.usersRepository.save(user);
    console.log('[User] 회원 탈퇴:', userId);
    return { success: true, message: '탈퇴가 완료되었습니다' };
  }
}
