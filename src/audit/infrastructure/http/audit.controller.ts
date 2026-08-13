import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { AuditAction } from '../../audit.service';
import { AuditService } from '../../audit.service';

export class AuditQueryDto {
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsIn(['CREATE', 'UPDATE', 'DELETE']) action?: AuditAction;
  @IsOptional() @IsString() changedBy?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar log de auditoría' })
  @ApiOkResponse({ description: 'Lista paginada de entradas de auditoría.' })
  async list(@Query() query: AuditQueryDto) {
    return this.auditService.query({
      entityType: query.entityType,
      action: query.action,
      changedBy: query.changedBy,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
