import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  Payment,
  PaymentStatus,
  PremiumType,
  PREMIUM_AMOUNT,
  PREMIUM_DAYS,
} from './payment.entity';
import { Post } from '../posts/post.entity';

@Injectable()
export class PaymentsService {
  private readonly tossSecretKey: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    private readonly config: ConfigService,
  ) {
    this.tossSecretKey = config.get<string>('TOSS_SECRET_KEY') ?? '';
  }

  /** 결제 요청 — 주문번호 생성 및 PENDING 레코드 저장 */
  async requestPayment(
    userId: string,
    postId: string,
    type: PremiumType,
  ): Promise<{ orderId: string; amount: number; orderName: string }> {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    if (post.authorId !== userId) throw new BadRequestException('본인 공고에만 상위노출 신청이 가능합니다.');

    const amount    = PREMIUM_AMOUNT[type];
    const orderId   = `banmo-${randomUUID()}`;
    const orderName = `공고 상위노출 ${PREMIUM_DAYS[type]}일`;

    await this.paymentRepo.save(
      this.paymentRepo.create({ userId, postId, orderId, amount, type }),
    );

    return { orderId, amount, orderName };
  }

  /** 결제 승인 — 토스 API 검증 후 post 업데이트 */
  async confirmPayment(dto: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId: dto.orderId } });
    if (!payment) throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('이미 처리된 결제입니다.');
    }
    if (payment.amount !== dto.amount) {
      throw new BadRequestException('결제 금액이 일치하지 않습니다.');
    }

    // 토스페이먼츠 API 호출
    const basicAuth = Buffer.from(`${this.tossSecretKey}:`).toString('base64');
    try {
      await axios.post(
        'https://api.tosspayments.com/v1/payments/confirm',
        { paymentKey: dto.paymentKey, orderId: dto.orderId, amount: dto.amount },
        { headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/json' } },
      );
    } catch (err: any) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      const msg = err.response?.data?.message ?? '결제 승인에 실패했습니다.';
      throw new BadRequestException(msg);
    }

    // 결제 성공 처리
    const days      = PREMIUM_DAYS[payment.type];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    payment.status     = PaymentStatus.SUCCESS;
    payment.paymentKey = dto.paymentKey;
    payment.paidAt     = new Date();
    await this.paymentRepo.save(payment);

    await this.postsRepo.update(payment.postId, {
      isPremium:        true,
      premiumExpiresAt: expiresAt,
    });

    return payment;
  }

  async getMyPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { userId },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });
  }
}
