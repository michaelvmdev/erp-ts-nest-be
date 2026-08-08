import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InvalidCredentialsError } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokenResponse {
  readonly accessToken: string;
  readonly userId: string;
  readonly email: string;
  readonly roleId: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async run(cmd: LoginCommand): Promise<AuthTokenResponse> {
    const user = await this.users.findByEmail(cmd.email);
    if (!user || !user.active) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(cmd.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    const payload = { sub: user.id.value, email: user.email, roleId: user.roleId };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, userId: user.id.value, email: user.email, roleId: user.roleId };
  }
}
