import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, LoginType, NoteGrade } from './user.entity';

function calcGrade(score: number): NoteGrade {
  if (score >= 100) return NoteGrade.PROFESSIONAL;
  if (score >= 60)  return NoteGrade.ADVANCED;
  if (score >= 30)  return NoteGrade.INTERMEDIATE;
  if (score >= 10)  return NoteGrade.BASIC;
  return NoteGrade.NONE;
}

const MAX_VIDEOS = 5;

export class UpdateProfileDto {
  nickname?: string;
  bio?: string;
  region?: string;
  instruments?: string[];
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { kakaoId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createEmailUser(data: {
    email: string;
    password: string;
    nickname: string;
    instruments?: string[];
  }): Promise<User> {
    const user = this.usersRepository.create({
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
    email?: string;
    profileImage?: string;
  }): Promise<User> {
    const partial: Partial<User> = {
      kakaoId: data.kakaoId,
      nickname: data.nickname ?? undefined,
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
      console.log(
        `[TrustScore] ${user.nickname ?? id}: ${oldGrade} → ${user.noteGrade} (score: ${user.trustScore})`,
      );
    }
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.region !== undefined) user.region = dto.region;
    if (dto.instruments !== undefined) user.instruments = dto.instruments;
    if (dto.phone !== undefined) (user as any).phone = dto.phone;
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

  async getPublicProfile(id: string): Promise<Omit<User, 'kakaoId' | 'email' | 'isBanned'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { kakaoId, email, isBanned, ...profile } = user;
    return profile;
  }
}
