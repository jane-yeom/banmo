import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  userId: string

  @Column({ type: 'date' })
  date: string

  @Column({ default: 1 })
  streakDays: number

  @CreateDateColumn()
  createdAt: Date
}
