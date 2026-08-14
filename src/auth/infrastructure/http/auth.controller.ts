import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ForgotPasswordUseCase } from '../../application/forgot-password.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { RefreshTokenUseCase } from '../../application/refresh-token.use-case';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { ResetPasswordUseCase } from '../../application/reset-password.use-case';
import { UserId } from '../../domain/user';
import { USER_REPOSITORY } from '../../domain/user.repository';
import type { UserRepository } from '../../domain/user.repository';
import { JwtGuard } from '../guards/jwt.guard';
import type { JwtPayload } from '../guards/jwt-payload.interface';
import { LoginRequestDto } from './dto/login.request.dto';
import { RegisterUserRequestDto } from './dto/register-user.request.dto';
import { UserResponseDto } from './dto/user.response.dto';

export class ForgotPasswordRequestDto {
  @IsEmail() email!: string;
}

export class ResetPasswordRequestDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUC: RegisterUserUseCase,
    private readonly loginUC: LoginUseCase,
    private readonly refreshTokenUC: RefreshTokenUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly forgotPasswordUC: ForgotPasswordUseCase,
    private readonly resetPasswordUC: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterUserRequestDto): Promise<UserResponseDto> {
    const user = await this.registerUC.run(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login — returns access token; sets refresh token cookie' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...body } = await this.loginUC.run(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      secure: process.env.NODE_ENV === 'production',
    });
    return body;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a new access token using the refresh token cookie' })
  async refresh(@Req() req: Request): Promise<{ accessToken: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = (req as any).cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('No hay refresh token.');
    return this.refreshTokenUC.execute(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear refresh token cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@Req() req: Request): Promise<UserResponseDto> {
    const payload = (req as Request & { user: JwtPayload }).user;
    const user = await this.users.findById(UserId.of(payload.sub));
    if (!user) throw new Error('User not found');
    return UserResponseDto.fromDomain(user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<void> {
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
    await this.forgotPasswordUC.execute(dto.email, frontendUrl);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<void> {
    await this.resetPasswordUC.execute(dto.token, dto.newPassword);
  }
}
