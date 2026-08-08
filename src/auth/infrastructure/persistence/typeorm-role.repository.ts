import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleId } from '../../domain/role';
import { ROLE_REPOSITORY } from '../../domain/role.repository';
import type { RoleRepository } from '../../domain/role.repository';
import { RoleOrmEntity } from './role.orm-entity';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly orm: Repository<RoleOrmEntity>,
  ) {}

  private toDomain(row: RoleOrmEntity): Role {
    return Role.rehydrate({
      id: RoleId.of(row.roleId),
      name: row.roleName,
      description: row.roleDescription,
    });
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.orm.find({ order: { roleName: 'ASC' } });
    return rows.map(r => this.toDomain(r));
  }

  async findById(id: RoleId): Promise<Role | null> {
    const row = await this.orm.findOne({ where: { roleId: id.value } });
    return row ? this.toDomain(row) : null;
  }
}

export const ROLE_REPOSITORY_PROVIDER = {
  provide: ROLE_REPOSITORY,
  useClass: TypeOrmRoleRepository,
};
