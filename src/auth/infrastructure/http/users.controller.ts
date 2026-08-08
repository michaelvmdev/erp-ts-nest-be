import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserUseCase } from '../../application/update-user.use-case';
import { USER_REPOSITORY } from '../../domain/user.repository';
import type { UserRepository } from '../../domain/user.repository';
import { JwtGuard } from '../guards/jwt.guard';
import { UpdateUserRequestDto } from './dto/update-user.request.dto';
import { PaginatedUsersResponseDto, UserResponseDto } from './dto/user.response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly updateUC: UpdateUserUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users (paginated)' })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedUsersResponseDto> {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const result = await this.users.search({ page: p, limit: l, offset: (p - 1) * l });
    return {
      items: result.items.map(UserResponseDto.fromDomain),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUC.run({ id, ...dto });
    return UserResponseDto.fromDomain(user);
  }
}
