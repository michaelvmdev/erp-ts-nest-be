import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserId } from '../domain/user';
import { RoleId } from '../domain/role';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: { sub: string; type: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; type: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token no es un refresh token.');
    }

    const user = await this.users.findById(UserId.of(payload.sub));
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo.');
    }

    const role = await this.roles.findById(RoleId.of(user.roleId));
    const roleName = role?.name ?? 'unknown';

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id.value, email: user.email, roleId: user.roleId, roleName, type: 'access' },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }
}
