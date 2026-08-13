import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { LoginUseCase } from '../../application/login.use-case';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { UserId } from '../../domain/user';
import { USER_REPOSITORY } from '../../domain/user.repository';
import type { UserRepository } from '../../domain/user.repository';
import { JwtGuard } from '../guards/jwt.guard';
import type { JwtPayload } from '../guards/jwt-payload.interface';
import { LoginRequestDto } from './dto/login.request.dto';
import { RegisterUserRequestDto } from './dto/register-user.request.dto';
import { UserResponseDto } from './dto/user.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUC: RegisterUserUseCase,
    private readonly loginUC: LoginUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterUserRequestDto): Promise<UserResponseDto> {
    const user = await this.registerUC.run(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login and get JWT' })
  async login(@Body() dto: LoginRequestDto) {
    return this.loginUC.run(dto);
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
}
