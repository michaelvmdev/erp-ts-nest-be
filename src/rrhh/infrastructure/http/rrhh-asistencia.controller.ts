import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RrhhAsistenciaService } from '../../rrhh-asistencia.service';

@ApiTags('rrhh-asistencia')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('rrhh/asistencia')
export class RrhhAsistenciaController {
  constructor(private readonly svc: RrhhAsistenciaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de asistencia' })
  list(
    @Query('employeeId') employeeId?: string,
    @Query('period') period?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.svc.list(employeeId, period, +page, +limit);
  }

  @Get('monthly-report')
  @ApiOperation({ summary: 'Reporte mensual de asistencia por empleado' })
  monthlyReport(@Query('period') period: string) { return this.svc.monthlyReport(period); }

  @Get('report')
  @ApiOperation({ summary: 'Reporte mensual de asistencia (alias)' })
  report(@Query('month') month: string) { return this.svc.monthlyReport(month); }

  @Post()
  @ApiOperation({ summary: 'Registrar asistencia' })
  register(@Body() dto: {
    employeeId: string; date: string; checkIn?: string; checkOut?: string;
    status?: string; notes?: string;
  }) {
    return this.svc.register(dto);
  }
}
