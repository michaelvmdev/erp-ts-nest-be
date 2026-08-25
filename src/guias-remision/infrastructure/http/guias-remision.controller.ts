import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { GuiasRemisionService } from '../../guias-remision.service';

@ApiTags('guias-remision')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('guias-remision')
export class GuiasRemisionController {
  constructor(private readonly svc: GuiasRemisionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar guías de remisión' })
  list(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.svc.list(+page, +limit, status);
  }

  @Get('motivos')
  @ApiOperation({ summary: 'Motivos de traslado SUNAT' })
  motivos() { return this.svc.motivos(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener guía de remisión por ID' })
  findOne(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir guía de remisión' })
  create(@Body() dto: {
    fechaTraslado: string; motivoTraslado: string; tipoTransporte?: string;
    rucTransportista?: string; placaVehiculo?: string; puntoPartida: string;
    puntoLlegada: string; saleId?: string; clientId?: string;
    items: Array<{ productId?: string; description: string; qty: number; unit: string }>;
    notes?: string;
  }) {
    return this.svc.create(dto);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular guía de remisión' })
  anular(@Param('id') id: string) { return this.svc.anular(id); }
}
