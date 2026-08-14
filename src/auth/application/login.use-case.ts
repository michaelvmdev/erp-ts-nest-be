import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InvalidCredentialsError } from '../domain/user';
import { RoleId } from '../domain/role';
import { ROLE_REPOSITORY } from '../domain/role.repository';
import type { RoleRepository } from '../domain/role.repository';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly email: string;
  readonly roleId: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly jwtService: JwtService,
  ) {}

  async run(cmd: LoginCommand): Promise<AuthTokenResponse> {
    const user = await this.users.findByEmail(cmd.email);
    if (!user || !user.active) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(cmd.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    const role = await this.roles.findById(RoleId.of(user.roleId));
    const roleName = role?.name ?? 'unknown';

    const accessPayload = { sub: user.id.value, email: user.email, roleId: user.roleId, roleName, type: 'access' };
    const accessToken = await this.jwtService.signAsync(accessPayload, { expiresIn: '15m' });

    const refreshPayload = { sub: user.id.value, type: 'refresh' };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, { expiresIn: '30d' });

    return { accessToken, refreshToken, userId: user.id.value, email: user.email, roleId: user.roleId };
  }
}
