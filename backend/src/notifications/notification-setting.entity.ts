import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  chatMessage: boolean;

  @Column({ default: true })
  application: boolean;

  @Column({ default: true })
  applicationStatus: boolean;

  @Column({ default: true })
  keyword: boolean;

  @Column({ default: true })
  comment: boolean;

  @Column({ default: true })
  favoritePost: boolean;

  @Column({ default: true })
  system: boolean;

  @Column({ default: true })
  notice: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ nullable: true, type: 'text' })
  fcmToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
