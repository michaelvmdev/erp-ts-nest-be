import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgotPasswordUseCase, PASSWORD_RESET_STORE } from './application/forgot-password.use-case';
import type { PasswordResetEntry } from './application/forgot-password.use-case';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { RoleOrmEntity } from './infrastructure/persistence/role.orm-entity';
import { ROLE_REPOSITORY_PROVIDER } from './infrastructure/persistence/typeorm-role.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { USER_REPOSITORY_PROVIDER } from './infrastructure/persistence/typeorm-user.repository';
import { JwtGuard } from './infrastructure/guards/jwt.guard';
import { AuthController } from './infrastructure/http/auth.controller';
import { UsersController } from './infrastructure/http/users.controller';
import { RolesController } from './infrastructure/http/roles.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, RoleOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') as any },
      }),
    }),
    MailModule,
  ],
  controllers: [AuthController, UsersController, RolesController],
  providers: [
    USER_REPOSITORY_PROVIDER,
    ROLE_REPOSITORY_PROVIDER,
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    UpdateUserUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    JwtGuard,
    {
      provide: PASSWORD_RESET_STORE,
      useFactory: () => new Map<string, PasswordResetEntry>(),
    },
  ],
  exports: [JwtModule, JwtGuard],
})
export class AuthModule {}
