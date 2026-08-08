import { Role, RoleId } from './role';

export interface RoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: RoleId): Promise<Role | null>;
}

export const ROLE_REPOSITORY = Symbol('RoleRepository');
