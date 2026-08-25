import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ConciliacionService } from '../../conciliacion.service';

@ApiTags('conciliacion')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('conciliacion')
export class ConciliacionController {
  constructor(private readonly svc: ConciliacionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar líneas de extracto bancario' })
  list(@Query('period') period: string, @Query('matchStatus') matchStatus?: string,
       @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.svc.listLines(period, matchStatus, +page, +limit);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de conciliación por período' })
  summary(@Query('period') period: string) { return this.svc.summary(period); }

  @Post('import')
  @ApiOperation({ summary: 'Importar líneas de extracto bancario' })
  importLines(@Body() dto: { period: string; lines: Array<{ movementDate: string; description: string; amount: number; reference?: string }> }) {
    return this.svc.importLines(dto.period, dto.lines);
  }

  @Patch(':id/match')
  @ApiOperation({ summary: 'Conciliar línea con movimiento de tesorería' })
  match(@Param('id') id: string, @Body() dto: { treasuryMovementId: string }) {
    return this.svc.matchLine(id, dto.treasuryMovementId);
  }

  @Patch(':id/ignore')
  @ApiOperation({ summary: 'Ignorar línea bancaria (diferencia justificada)' })
  ignore(@Param('id') id: string) { return this.svc.ignoreLine(id); }
}
