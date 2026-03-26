import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, NoteGrade } from './user.entity';

export enum TrustEvent {
  POST_CREATED      = 'POST_CREATED',       // +2
  DEAL_ACCEPTED     = 'DEAL_ACCEPTED',       // +5
  CHAT_RESPONSIVE   = 'CHAT_RESPONSIVE',     // +3
  REPORTED          = 'REPORTED',            // -10
  FRAUD_RESOLVED    = 'FRAUD_RESOLVED',      // -30 + 자동 밴 검토
}

const SCORE_DELTA: Record<TrustEvent, number> = {
  [TrustEvent.POST_CREATED]:    2,
  [TrustEvent.DEAL_ACCEPTED]:   5,
  [TrustEvent.CHAT_RESPONSIVE]: 3,
  [TrustEvent.REPORTED]:       -10,
  [TrustEvent.FRAUD_RESOLVED]: -30,
};

// 점수 → 음표 등급
function calcGrade(score: number): NoteGrade {
  if (score >= 100) return NoteGrade.PROFESSIONAL; // 온음표
  if (score >= 60)  return NoteGrade.ADVANCED;     // 2분음표
  if (score >= 30)  return NoteGrade.INTERMEDIATE; // 4분음표
  if (score >= 10)  return NoteGrade.BASIC;        // 8분음표
  return NoteGrade.NONE;                            // 16분음표 (신규)
}

@Injectable()
export class TrustService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async applyEvent(userId: string, event: TrustEvent): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const delta = SCORE_DELTA[event];
    user.trustScore = Math.max(0, user.trustScore + delta);
    user.noteGrade  = calcGrade(user.trustScore);

    // FRAUD_RESOLVED: 점수 0 이하 시 자동 밴
    if (event === TrustEvent.FRAUD_RESOLVED && user.trustScore === 0) {
      user.isBanned = true;
    }

    return this.usersRepo.save(user);
  }

  /** 외부에서 특정 유저의 등급만 재계산할 때 */
  async recalcGrade(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;
    user.noteGrade = calcGrade(user.trustScore);
    await this.usersRepo.save(user);
  }
}
