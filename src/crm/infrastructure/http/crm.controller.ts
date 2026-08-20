import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { CrmLeadEntity } from '../orm/crm-lead.entity';
import { CrmActivityEntity } from '../orm/crm-activity.entity';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const;

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('crm')
export class CrmController {
  constructor(
    @InjectRepository(CrmLeadEntity)
    private readonly leads: Repository<CrmLeadEntity>,
    @InjectRepository(CrmActivityEntity)
    private readonly activities: Repository<CrmActivityEntity>,
  ) {}

  /* ─── LEADS ─────────────────────────────────────────────────────── */

  @Get('leads')
  @ApiOperation({ summary: 'Listar leads con filtros opcionales' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  async listLeads(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page = '1',
    @Query('limit')  limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const where: Record<string, unknown>[] = [];

    const base: Record<string, unknown> = { deletedAt: IsNull() };
    if (status && STATUSES.includes(status as typeof STATUSES[number])) {
      base.status = status;
    }

    if (search) {
      where.push({ ...base, fullName: Like(`%${search}%`) });
      where.push({ ...base, company:  Like(`%${search}%`) });
      where.push({ ...base, email:    Like(`%${search}%`) });
    } else {
      where.push(base);
    }

    const [items, total] = await this.leads.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { items, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Pipeline agrupado por status con totales' })
  async pipeline() {
    const rows = await this.leads
      .createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COALESCE(SUM(l.estimated_value),0)::numeric', 'totalValue')
      .where('l.deleted_at IS NULL')
      .groupBy('l.status')
      .getRawMany<{ status: string; count: number; totalValue: string }>();

    return STATUSES.map((s) => {
      const found = rows.find((r) => r.status === s);
      return {
        status: s,
        count:      found ? found.count      : 0,
        totalValue: found ? found.totalValue : '0',
      };
    });
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Detalle de un lead con sus actividades' })
  async getLead(@Param('id', ParseUUIDPipe) id: string) {
    return this.leads.findOneOrFail({
      where: { leadId: id, deletedAt: IsNull() },
      relations: ['activities'],
      order: { activities: { activityDate: 'DESC' } },
    });
  }

  @Post('leads')
  @ApiOperation({ summary: 'Crear lead' })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Juan Pérez', company: 'ACME SAC', email: 'jp@acme.com',
        phone: '987654321', source: 'web', status: 'new', estimatedValue: 5000,
        notes: 'Interesado en producto X',
      },
    },
  })
  async createLead(@Body() body: Partial<CrmLeadEntity>, @Req() req: any) {
    const lead = this.leads.create({
      ...body,
      assignedTo: body.assignedTo ?? req.user?.email ?? 'system',
    });
    return this.leads.save(lead);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Actualizar lead (status, notas, valor estimado, etc.)' })
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<CrmLeadEntity>,
  ) {
    await this.leads.update(id, body);
    return this.leads.findOneOrFail({ where: { leadId: id } });
  }

  @Delete('leads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar lead (soft-delete)' })
  async deleteLead(@Param('id', ParseUUIDPipe) id: string) {
    await this.leads.softDelete(id);
  }

  /* ─── ACTIVIDADES ────────────────────────────────────────────────── */

  @Get('leads/:id/activities')
  @ApiOperation({ summary: 'Actividades de un lead' })
  async listActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.activities.find({
      where: { leadId: id },
      order: { activityDate: 'DESC' },
    });
  }

  @Post('leads/:id/activities')
  @ApiOperation({ summary: 'Registrar actividad en un lead' })
  @ApiBody({
    schema: {
      example: {
        type: 'call', subject: 'Primera llamada', description: 'Se coordinó reunión',
        activityDate: '2026-08-20T10:00:00Z', completed: true,
      },
    },
  })
  async createActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<CrmActivityEntity>,
    @Req() req: any,
  ) {
    const activity = this.activities.create({
      ...body,
      leadId:    id,
      createdBy: req.user?.email ?? 'system',
    });
    return this.activities.save(activity);
  }

  @Patch('activities/:actId/complete')
  @ApiOperation({ summary: 'Marcar actividad como completada' })
  async completeActivity(@Param('actId', ParseUUIDPipe) actId: string) {
    await this.activities.update(actId, { completed: true });
    return this.activities.findOneOrFail({ where: { activityId: actId } });
  }
}
