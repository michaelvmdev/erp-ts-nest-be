import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RetencionesService } from '../../retenciones.service';

class CreateRetencionDto {
  @IsUUID()    purchaseId!: string;
  @IsUUID()    supplierId!: string;
  @IsNumber() @Min(0) baseAmount!: number;
  @IsString()  period!: string;
  @IsString() @IsOptional() notes?: string;
}

@ApiTags('retenciones')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('retenciones')
export class RetencionesController {
  constructor(private readonly svc: RetencionesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar retenciones IGV' })
  @ApiOkResponse({ description: 'Lista paginada de retenciones.' })
  list(
    @Query('period') period?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.list(period, supplierId, status, +page, +limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar retención IGV (3%)' })
  create(@Body() dto: CreateRetencionDto) {
    return this.svc.create(dto);
  }

  @Patch(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar retención como pagada a SUNAT' })
  pay(@Param('id') id: string) {
    return this.svc.pay(id);
  }
}
