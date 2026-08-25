import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { CostCentersService } from '../../cost-centers.service';

@ApiTags('cost-centers')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly svc: CostCentersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar centros de costo' })
  list(@Query('active') active?: string) {
    return this.svc.list(active !== undefined ? active === 'true' : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener centro de costo por ID' })
  findOne(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @ApiOperation({ summary: 'Crear centro de costo' })
  create(@Body() dto: { code: string; name: string; parentId?: string }) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar centro de costo' })
  update(@Param('id') id: string, @Body() dto: { name?: string; active?: boolean }) {
    return this.svc.update(id, dto);
  }
}
