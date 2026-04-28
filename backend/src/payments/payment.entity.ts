import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

export enum PremiumType {
  PREMIUM_1DAY  = 'PREMIUM_1DAY',   // 10,000원  1일
  PREMIUM_7DAY  = 'PREMIUM_7DAY',   // 50,000원  7일
  PREMIUM_30DAY = 'PREMIUM_30DAY',  // 150,000원 30일
}

export enum PaymentStatus {
  PENDING   = 'PENDING',
  SUCCESS   = 'SUCCESS',
  FAILED    = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED  = 'REFUNDED',
}

export const PREMIUM_AMOUNT: Record<PremiumType, number> = {
  [PremiumType.PREMIUM_1DAY]:  10_000,
  [PremiumType.PREMIUM_7DAY]:  50_000,
  [PremiumType.PREMIUM_30DAY]: 150_000,
};

export const PREMIUM_DAYS: Record<PremiumType, number> = {
  [PremiumType.PREMIUM_1DAY]:  1,
  [PremiumType.PREMIUM_7DAY]:  7,
  [PremiumType.PREMIUM_30DAY]: 30,
};

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: string;

  @Column({ unique: true })
  orderId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: PremiumType })
  type: PremiumType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  paymentKey: string;

  @Column({ nullable: true })
  tossOrderId: string;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
