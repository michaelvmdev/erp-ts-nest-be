import { Page } from '../../shared/domain/pagination';
import { User, UserId } from './user';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  search(params: { page: number; limit: number; offset: number }): Promise<Page<User>>;
  insert(user: User): Promise<void>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
