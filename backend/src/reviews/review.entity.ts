import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User

  @Column({ name: 'reviewer_id' })
  reviewerId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User

  @Column({ name: 'reviewee_id' })
  revieweeId: string

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'post_id' })
  post: Post

  @Column({ name: 'post_id', nullable: true })
  postId: string

  @Column({ type: 'int' })
  rating: number

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ name: 'is_public', default: true })
  isPublic: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
