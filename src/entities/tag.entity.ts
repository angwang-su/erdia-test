import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  slug: string;

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}

