import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
@Unique(['follower', 'following']) // 중복 팔로우 방지
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.following)
  follower: User; // 팔로우 하는 사람

  @ManyToOne(() => User, (user) => user.followers)
  following: User; // 팔로우 받는 사람
}

