import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → any authenticated user is allowed
    if (!required || required.length === 0) return true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    if (!user) throw new ForbiddenException('Sin autenticación.');

    if (!required.includes(user.roleName)) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los roles: ${required.join(', ')}.`,
      );
    }
    return true;
  }
}
