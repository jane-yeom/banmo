import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
    };
    const user = this.usersRepository.create(partial as User);
    return this.usersRepository.save(user);
  }

  async updateTrustScore(id: string, delta: number): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ where: { id } });
    user.trustScore = Math.max(0, user.trustScore + delta);
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
