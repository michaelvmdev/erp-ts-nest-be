import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE_REPOSITORY } from '../../domain/role.repository';
import type { RoleRepository } from '../../domain/role.repository';
import { JwtGuard } from '../guards/jwt.guard';
import { RoleResponseDto } from './dto/role.response.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.roles.findAll();
    return roles.map(RoleResponseDto.fromDomain);
  }
}
