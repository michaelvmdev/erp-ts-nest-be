import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Marks the roles allowed to access an endpoint. Must be combined with JwtGuard + RolesGuard. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
