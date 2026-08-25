import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RrhhVacacionesService } from '../../rrhh-vacaciones.service';
import { RrhhLiquidacionService } from '../../rrhh-liquidacion.service';

@ApiTags('rrhh-vacaciones')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('rrhh/vacaciones')
export class RrhhVacacionesController {
  constructor(
    private readonly svc: RrhhVacacionesService,
    private readonly liquidacionSvc: RrhhLiquidacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de vacaciones' })
  list(@Query('employeeId') employeeId?: string, @Query('status') status?: string,
       @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.list(employeeId, status, +page, +limit);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Saldo de vacaciones acumuladas de un empleado' })
  balance(@Query('employeeId') employeeId: string) { return this.svc.accrualBalance(employeeId); }

  @Get('liquidacion/:employeeId')
  @ApiOperation({ summary: 'Cálculo de liquidación de beneficios al cese' })
  liquidacion(@Param('employeeId') employeeId: string) { return this.liquidacionSvc.compute(employeeId); }

  @Post('liquidacion/compute')
  @ApiOperation({ summary: 'Calcular liquidación con fecha de cese personalizada' })
  computeLiquidacion(@Body() dto: { employeeId: string; terminationDate: string }) {
    return this.liquidacionSvc.compute(dto.employeeId, dto.terminationDate);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar vacaciones' })
  request(@Body() dto: { employeeId: string; startDate: string; endDate: string; reason?: string }) {
    return this.svc.request(dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprobar solicitud de vacaciones' })
  approve(@Param('id') id: string, @Req() req: Request) {
    const user = (req as unknown as { user: { email: string } }).user;
    return this.svc.approve(id, user.email);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rechazar solicitud de vacaciones' })
  reject(@Param('id') id: string) { return this.svc.reject(id); }
}
