import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { CuentasCobrarService } from '../../cuentas-cobrar.service';

@ApiTags('cuentas-cobrar')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('cuentas-cobrar')
export class CuentasCobrarController {
  constructor(private readonly svc: CuentasCobrarService) {}

  @Get()
  @ApiOperation({ summary: 'Cuentas por cobrar con aging report' })
  cobrar(@Query('clientId') clientId?: string) { return this.svc.aging(clientId); }

  @Get('pagar')
  @ApiOperation({ summary: 'Cuentas por pagar con aging report' })
  pagar(@Query('supplierId') supplierId?: string) { return this.svc.agingPagar(supplierId); }
}
