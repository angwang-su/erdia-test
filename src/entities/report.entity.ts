import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  type: string; // 'post', 'comment', 'user'

  @Column({ type: 'varchar' })
  reason: string; // 'spam', 'harassment', 'inappropriate', 'other'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'pending', 'reviewing', 'resolved', 'rejected'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reports)
  reporter: User; // 신고한 사람

  @ManyToOne(() => Post, { nullable: true })
  post: Post;

  @ManyToOne(() => Comment, { nullable: true })
  comment: Comment;

  @ManyToOne(() => User, { nullable: true })
  reportedUser: User; // 신고당한 사람
}

