import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserId } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
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

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id.value, email: user.email, roleId: user.roleId, type: 'access' },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }
}
