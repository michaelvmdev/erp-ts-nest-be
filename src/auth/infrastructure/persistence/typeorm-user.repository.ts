import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { User, UserId } from '../../domain/user';
import { USER_REPOSITORY } from '../../domain/user.repository';
import type { UserRepository } from '../../domain/user.repository';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly orm: Repository<UserOrmEntity>,
  ) {}

  private toDomain(row: UserOrmEntity): User {
    return User.rehydrate({
      id: UserId.of(row.userId),
      roleId: row.roleId,
      email: row.userEmail,
      name: row.userName,
      passwordHash: row.passwordHash,
      active: row.userActive,
      createdAt: row.createdAt,
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.orm.findOne({ where: { userId: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.orm.findOne({ where: { userEmail: email.toLowerCase().trim() } });
    return row ? this.toDomain(row) : null;
  }

  async search(params: { page: number; limit: number; offset: number }): Promise<Page<User>> {
    const [rows, total] = await this.orm.findAndCount({
      order: { userName: 'ASC' },
      skip: params.offset,
      take: params.limit,
    });
    return new Page<User>(rows.map(r => this.toDomain(r)), total, params.page, params.limit);
  }

  async insert(user: User): Promise<void> {
    const snap = user.toSnapshot();
    await this.orm.insert({
      userId: snap.id,
      roleId: snap.roleId,
      userEmail: snap.email,
      userName: snap.name,
      passwordHash: snap.passwordHash,
      userActive: snap.active,
      createdAt: snap.createdAt,
    });
  }

  async save(user: User): Promise<void> {
    const snap = user.toSnapshot();
    await this.orm.update({ userId: snap.id }, {
      roleId: snap.roleId,
      userName: snap.name,
      userActive: snap.active,
    });
  }
}

export const USER_REPOSITORY_PROVIDER = {
  provide: USER_REPOSITORY,
  useClass: TypeOrmUserRepository,
};
