import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum NoteGrade {
  NONE = 'NONE',
  BASIC = 'BASIC',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum LoginType {
  KAKAO = 'kakao',
  EMAIL = 'email',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  kakaoId: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  instruments: string[];

  @Column({ type: 'simple-array', nullable: true, default: '' })
  videoUrls: string[];

  @Column({
    type: 'enum',
    enum: NoteGrade,
    default: NoteGrade.NONE,
  })
  noteGrade: NoteGrade;

  @Column({ type: 'float', default: 0 })
  trustScore: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: LoginType,
    default: LoginType.EMAIL,
  })
  loginType: LoginType;

  @Column({ default: false })
  isBanned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  sanitizeArrays() {
    this.instruments = (this.instruments ?? []).filter(Boolean);
    this.videoUrls = (this.videoUrls ?? []).filter(Boolean);
  }
}
