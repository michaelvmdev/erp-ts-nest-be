import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AuditService } from '../../../audit/audit.service';
import { ActivosFijosService } from '../../activos-fijos.service';

class CreateAssetDto {
  @IsString()              code!: string;
  @IsString()              name!: string;
  @IsOptional() @IsString() description?: string;
  @IsString()              category!: string;
  @IsISO8601()             acquisitionDate!: string;
  @IsNumber() @Min(0.01) @Type(() => Number) acquisitionCost!: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) residualValue?: number;
  @IsInt() @Min(1) @Type(() => Number) usefulLifeYears!: number;
  @IsOptional() @IsIn(['linear', 'accelerated']) depreciationMethod?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() notes?: string;
}

class AddMaintenanceDto {
  @IsISO8601()             maintenanceDate!: string;
  @IsIn(['preventive', 'corrective']) type!: string;
  @IsString()              description!: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) cost?: number;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsISO8601() nextMaintenance?: string;
}

@ApiTags('activos-fijos')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('activos-fijos')
export class ActivosFijosController {
  constructor(
    private readonly svc: ActivosFijosService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar activos fijos' })
  @ApiQuery({ name: 'status',   required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'limit',    required: false })
  search(
    @Query('status')   status?: string,
    @Query('category') category?: string,
    @Query('page')     page?: string,
    @Query('limit')    limit?: string,
  ) {
    return this.svc.search(status, category, parseInt(page ?? '1') || 1, parseInt(limit ?? '20') || 20);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener activo fijo por ID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar activo fijo' })
  @ApiBody({ type: CreateAssetDto })
  async create(
    @Body() dto: CreateAssetDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const a = await this.svc.create(dto);
    void this.audit.log('fixed_asset', a.assetId, 'CREATE', req.user?.email ?? 'system', { code: dto.code });
    return a;
  }

  @Patch(':id/dispose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja un activo fijo' })
  async dispose(
    @Param('id', new ParseUUIDPipe()) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const a = await this.svc.dispose(id);
    void this.audit.log('fixed_asset', id, 'UPDATE', req.user?.email ?? 'system', { status: 'disposed' });
    return a;
  }

  @Post('depreciation/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcular y registrar depreciación mensual', description: 'period = YYYY-MM' })
  async runDepreciation(
    @Body('period') period: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const result = await this.svc.runDepreciation(period);
    void this.audit.log('depreciation_run', 'system', 'CREATE', req.user?.email ?? 'system', { period, ...result });
    return result;
  }

  @Get(':id/depreciation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Historial de depreciación del activo' })
  getDepreciation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.getDepreciation(id);
  }

  @Post(':id/maintenances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar mantenimiento de activo' })
  @ApiBody({ type: AddMaintenanceDto })
  async addMaintenance(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddMaintenanceDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const m = await this.svc.addMaintenance({ assetId: id, ...dto });
    void this.audit.log('asset_maintenance', m.maintenanceId, 'CREATE', req.user?.email ?? 'system', { assetId: id });
    return m;
  }

  @Get(':id/maintenances')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Historial de mantenimientos del activo' })
  getMaintenances(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.getMaintenances(id);
  }
}
