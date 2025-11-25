import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar' })
  type: string; // 'image', 'video', 'audio'

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'integer', nullable: true })
  size: number; // bytes

  @Column({ type: 'varchar', nullable: true })
  mimeType: string;

  @Column({ type: 'integer', default: 0 })
  order: number; // 미디어 순서

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.media)
  post: Post;
}

