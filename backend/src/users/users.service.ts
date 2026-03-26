import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
}
