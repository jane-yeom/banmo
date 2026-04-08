import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PostCategory {
  JOB_OFFER = 'JOB_OFFER',
  JOB_SEEK = 'JOB_SEEK',
  LESSON_OFFER = 'LESSON_OFFER',
  LESSON_SEEK = 'LESSON_SEEK',
  PERFORMANCE = 'PERFORMANCE',
  AFTERSCHOOL = 'AFTERSCHOOL',
  PROMO_CONCERT = 'PROMO_CONCERT',
  PROMO_SPACE = 'PROMO_SPACE',
  TRADE_LESSON = 'TRADE_LESSON',
  TRADE_SPACE = 'TRADE_SPACE',
  TRADE_TICKET = 'TRADE_TICKET',
  TRADE_INSTRUMENT = 'TRADE_INSTRUMENT',
}

export enum PayType {
  HOURLY = 'HOURLY',
  PER_SESSION = 'PER_SESSION',
  MONTHLY = 'MONTHLY',
  NEGOTIABLE = 'NEGOTIABLE',
}

export enum PostStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  HIDDEN = 'HIDDEN',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: PostCategory })
  category: PostCategory;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  instruments: string[];

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'enum', enum: PayType })
  payType: PayType;

  @Column({ type: 'int' })
  payMin: number;

  @Column({ type: 'int', nullable: true })
  payMax: number;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  premiumExpiresAt: Date;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  imageUrls: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  sanitizeArrays() {
    this.instruments = (this.instruments ?? []).filter(Boolean);
    this.imageUrls = (this.imageUrls ?? []).filter(Boolean);
  }
}
