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

export enum QnaCategory {
  GENERAL = 'GENERAL',
  PAY = 'PAY',
  REPORT = 'REPORT',
  ACCOUNT = 'ACCOUNT',
  ETC = 'ETC',
}

export enum QnaStatus {
  PENDING = 'PENDING',
  ANSWERED = 'ANSWERED',
}

@Entity('qnas')
export class Qna {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  authorId: string | null;

  @Column({ nullable: true })
  authorName: string;

  @Column()
  authorEmail: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: QnaCategory })
  category: QnaCategory;

  @Column({ type: 'enum', enum: QnaStatus, default: QnaStatus.PENDING })
  status: QnaStatus;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ nullable: true, type: 'timestamp' })
  answeredAt: Date;

  @Column({ default: true })
  isPrivate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
