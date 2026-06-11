import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'user_id' })
  userId: string

  @Column({ type: 'date' })
  date: string

  @Column({ name: 'streak_days', default: 1 })
  streakDays: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
