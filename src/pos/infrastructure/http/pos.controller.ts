import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { PosSessionEntity } from '../orm/pos-session.entity';

@ApiTags('pos')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('pos')
export class PosController {
  constructor(
    @InjectRepository(PosSessionEntity)
    private readonly sessions: Repository<PosSessionEntity>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  /* ─── SESIONES ───────────────────────────────────────────────────── */

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones POS' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  async listSessions(
    @Query('status') status?: string,
    @Query('page')   page  = '1',
    @Query('limit')  limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    const where = status ? { status } : {};
    const [items, total] = await this.sessions.findAndCount({
      where,
      order: { openedAt: 'DESC' },
      skip,
      take,
    });
    return { items, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get('sessions/open')
  @ApiOperation({ summary: 'Sesión abierta del cajero actual' })
  async myOpenSession(@Req() req: any) {
    const session = await this.sessions.findOne({
      where: { cashierEmail: req.user?.email, status: 'open' },
      order: { openedAt: 'DESC' },
    });
    return session ?? null;
  }

  @Post('sessions/open')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir turno de caja' })
  @ApiBody({ schema: { example: { openingAmount: 200, notes: 'Apertura turno mañana' } } })
  async openSession(@Body() body: { openingAmount?: number; notes?: string }, @Req() req: any) {
    const existing = await this.sessions.findOne({
      where: { cashierEmail: req.user?.email, status: 'open' },
    });
    if (existing) return { error: 'Ya tienes una sesión abierta', session: existing };
    const session = this.sessions.create({
      cashierEmail: req.user?.email ?? 'system',
      cashierName:  req.user?.email ?? 'system',
      openingAmount: String(body.openingAmount ?? 0),
      status: 'open',
      notes: body.notes ?? null,
    });
    return this.sessions.save(session);
  }

  @Patch('sessions/:id/close')
  @ApiOperation({ summary: 'Cerrar turno de caja' })
  @ApiBody({ schema: { example: { closingAmount: 850.50, notes: 'Cierre turno tarde' } } })
  async closeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { closingAmount?: number; notes?: string },
  ) {
    const session = await this.sessions.findOneOrFail({ where: { sessionId: id } });
    if (session.status === 'closed') return { error: 'La sesión ya está cerrada' };

    const totals = await this.ds.query<{ total_sales: string; sales_count: string }[]>(
      `SELECT COALESCE(SUM(total),0)::TEXT AS total_sales, COUNT(*)::TEXT AS sales_count
         FROM sales WHERE pos_session_id = $1`,
      [id],
    );
    await this.sessions.update(id, {
      status: 'closed',
      closedAt: new Date(),
      closingAmount: String(body.closingAmount ?? 0),
      totalSales: totals[0]?.total_sales ?? '0',
      salesCount: Number(totals[0]?.sales_count ?? 0),
      notes: body.notes ?? session.notes,
    });
    return this.sessions.findOneOrFail({ where: { sessionId: id } });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Detalle de sesión + ventas' })
  async getSession(@Param('id', ParseUUIDPipe) id: string) {
    const session = await this.sessions.findOneOrFail({ where: { sessionId: id } });
    const sales = await this.ds.query(
      `SELECT s.sale_id, s.sale_number, s.sale_date, s.total,
              c.client_description
         FROM sales s
         LEFT JOIN clients c ON c.client_id = s.client_id
        WHERE s.pos_session_id = $1
        ORDER BY s.created_at DESC`,
      [id],
    );
    return { session, sales };
  }

  /* ─── PRODUCTOS RÁPIDOS ──────────────────────────────────────────── */

  @Get('products')
  @ApiOperation({ summary: 'Buscar productos para el POS' })
  @ApiQuery({ name: 'search', required: false })
  async searchProducts(@Query('search') search?: string) {
    const like = `%${search ?? ''}%`;
    return this.ds.query(
      `SELECT p.product_id, p.product_name, p.product_description, p.product_unit_price AS sale_price,
              COALESCE(SUM(sm.quantity),0)::NUMERIC AS stock
         FROM products p
         LEFT JOIN stock_movements sm ON sm.product_id = p.product_id
        WHERE p.product_active = true AND p.deleted_at IS NULL
          AND (p.product_name ILIKE $1 OR p.product_description ILIKE $1)
        GROUP BY p.product_id
        ORDER BY p.product_name
        LIMIT 30`,
      [like],
    );
  }

  /* ─── ESTADÍSTICAS DEL DÍA ───────────────────────────────────────── */

  @Get('stats/today')
  @ApiOperation({ summary: 'Estadísticas POS del día actual' })
  async todayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [salesRow, sessionsRow] = await Promise.all([
      this.ds.query<{ total: string; cnt: string }[]>(
        `SELECT COALESCE(SUM(total),0)::TEXT AS total, COUNT(*)::TEXT AS cnt
           FROM sales WHERE sale_date = $1 AND pos_session_id IS NOT NULL`,
        [today],
      ),
      this.ds.query<{ cnt: string }[]>(
        `SELECT COUNT(*)::TEXT AS cnt FROM pos_sessions WHERE opened_at::date = $1`,
        [today],
      ),
    ]);
    return {
      date:         today,
      totalSales:   salesRow[0].total,
      salesCount:   Number(salesRow[0].cnt),
      sessionsCount: Number(sessionsRow[0].cnt),
    };
  }
}
