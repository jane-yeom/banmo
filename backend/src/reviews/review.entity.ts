import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User

  @Column()
  reviewerId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'revieweeId' })
  reviewee: User

  @Column()
  revieweeId: string

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'postId' })
  post: Post

  @Column({ nullable: true })
  postId: string

  @Column({ type: 'int' })
  rating: number

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ default: true })
  isPublic: boolean

  @CreateDateColumn()
  createdAt: Date
}
