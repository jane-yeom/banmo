import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('board_tags')
export class BoardTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 0 })
  useCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
