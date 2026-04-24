import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  APPLICATION = 'APPLICATION',
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  KEYWORD = 'KEYWORD',
  COMMENT = 'COMMENT',
  FAVORITE_POST = 'FAVORITE_POST',
  SYSTEM = 'SYSTEM',
  NOTICE = 'NOTICE',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ nullable: true })
  senderId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true })
  link: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
