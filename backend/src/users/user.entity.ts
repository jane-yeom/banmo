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
  SIXTEENTH = 'SIXTEENTH',   // 16분음표 (신규/0점)
  EIGHTH = 'EIGHTH',         // 8분음표 (10점 이상)
  QUARTER = 'QUARTER',       // 4분음표 (30점 이상)
  HALF = 'HALF',             // 2분음표 (60점 이상)
  WHOLE = 'WHOLE',           // 온음표 (100점 이상)
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
    default: NoteGrade.SIXTEENTH,
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

  @Column({ nullable: true, type: 'text' })
  banReason: string;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;

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
