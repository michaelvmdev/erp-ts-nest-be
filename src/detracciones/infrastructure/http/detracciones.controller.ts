import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation,
  ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { IsISO8601, IsNumberString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AuditService } from '../../../audit/audit.service';
import { DetraccionesService, SPOT_THRESHOLD_SOLES } from '../../detracciones.service';

class CreateDetraccionDto {
  @IsString()
  saleId!: string;

  @IsString()
  code!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseAmount!: number;
}

class MarkPaidDto {
  @IsISO8601()
  paymentDate!: string;

  @IsString()
  paymentNumber!: string;
}

class CalculateQueryDto {
  @IsNumberString()
  amount!: string;

  @IsString()
  code!: string;
}

@ApiTags('detracciones')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('detracciones')
export class DetraccionesController {
  constructor(
    private readonly svc: DetraccionesService,
    private readonly audit: AuditService,
  ) {}

  @Get('codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar códigos SPOT vigentes' })
  listCodes() { return this.svc.listCodes(); }

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular detracción',
    description: `Retorna el monto a detraer. Umbral: S/. ${SPOT_THRESHOLD_SOLES}.`,
  })
  @ApiQuery({ name: 'amount', description: 'Importe de la venta en soles' })
  @ApiQuery({ name: 'code',   description: 'Código SPOT (e.g. 037)' })
  calculate(@Query() q: CalculateQueryDto) {
    return this.svc.calculate(parseFloat(q.amount), 0); // rate resolved internally
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar detracciones registradas' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'paid', 'exempt'] })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  search(
    @Query('status') status?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.svc.search(status, parseInt(page ?? '1') || 1, parseInt(limit ?? '20') || 20);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar detracción para una venta' })
  @ApiBody({ type: CreateDetraccionDto })
  async create(
    @Body() dto: CreateDetraccionDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const d = await this.svc.create(dto);
    void this.audit.log('detraccion', d.detraccionId, 'CREATE', req.user?.email ?? 'system', { saleId: dto.saleId, code: dto.code });
    return d;
  }

  @Patch(':id/paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar detracción como pagada' })
  @ApiBody({ type: MarkPaidDto })
  async markPaid(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MarkPaidDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const d = await this.svc.markPaid(id, dto.paymentDate, dto.paymentNumber);
    void this.audit.log('detraccion', id, 'UPDATE', req.user?.email ?? 'system', { status: 'paid', paymentNumber: dto.paymentNumber });
    return d;
  }
}
