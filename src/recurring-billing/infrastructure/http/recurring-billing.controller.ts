import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RecurringInvoiceEntity } from '../orm/recurring-invoice.entity';
import { RecurringInvoiceItemEntity } from '../orm/recurring-invoice-item.entity';

const FREQ_DAYS: Record<string, number> = {
  weekly: 7, monthly: 30, bimonthly: 60, quarterly: 90, semiannual: 180, annual: 365,
};

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@ApiTags('recurring-billing')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('recurring-billing')
export class RecurringBillingController {
  constructor(
    @InjectRepository(RecurringInvoiceEntity)     private readonly repo: Repository<RecurringInvoiceEntity>,
    @InjectRepository(RecurringInvoiceItemEntity) private readonly items: Repository<RecurringInvoiceItemEntity>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  async list(
    @Query('status') status?: string,
    @Query('page')   page  = '1',
    @Query('limit')  limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [invoices, total] = await this.repo.findAndCount({
      where, order: { nextBillingDate: 'ASC' }, skip, take, relations: ['items'],
    });
    return { items: invoices, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get('due-today')
  @ApiOperation({ summary: 'Facturas recurrentes con vencimiento hoy o anterior (pendientes de generar)' })
  async dueToday() {
    const today = new Date().toISOString().slice(0, 10);
    return this.repo.find({
      where: { status: 'active', nextBillingDate: LessThanOrEqual(today) },
      relations: ['items'],
      order: { nextBillingDate: 'ASC' },
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.findOneOrFail({ where: { recurringId: id }, relations: ['items'] });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { clientId: string; description: string; frequency: string; nextBillingDate: string;
                    subTotal: number; igv: number; total: number; notes?: string;
                    items?: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }> },
    @Req() req: any,
  ) {
    const invoice = this.repo.create({
      clientId: body.clientId,
      description: body.description,
      frequency: body.frequency,
      nextBillingDate: body.nextBillingDate,
      subTotal: String(body.subTotal),
      igv: String(body.igv),
      total: String(body.total),
      notes: body.notes ?? null,
      status: 'active',
      createdBy: req.user?.email ?? 'system',
    });
    const saved = await this.repo.save(invoice);

    if (body.items?.length) {
      const itemEntities = body.items.map((i) =>
        this.items.create({
          recurringId:  saved.recurringId,
          description:  i.description,
          quantity:     String(i.quantity),
          unitPrice:    String(i.unitPrice),
          subtotal:     String(i.subtotal),
        }),
      );
      await this.items.save(itemEntities);
    }
    return this.repo.findOneOrFail({ where: { recurringId: saved.recurringId }, relations: ['items'] });
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<RecurringInvoiceEntity>) {
    await this.repo.update(id, body);
    return this.repo.findOneOrFail({ where: { recurringId: id } });
  }

  @Post(':id/bill')
  @ApiOperation({ summary: 'Generar factura ahora y avanzar próxima fecha' })
  async billNow(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const invoice = await this.repo.findOneOrFail({ where: { recurringId: id }, relations: ['items'] });
    if (invoice.status !== 'active') return { error: 'La factura recurrente no está activa' };

    const today    = new Date().toISOString().slice(0, 10);
    const days     = FREQ_DAYS[invoice.frequency] ?? 30;
    const nextDate = addDays(today, days);

    const [clientRow] = await this.ds.query<{ client_description: string; document_number: string }[]>(
      `SELECT client_description, document_number FROM clients WHERE client_id = $1`, [invoice.clientId],
    );
    const [saleTypeRow] = await this.ds.query<{ sale_type_id: string }[]>(
      `SELECT sale_type_id FROM sale_types LIMIT 1`,
    );

    const saleCount = await this.ds.query<{ cnt: string }[]>(`SELECT COUNT(*)::TEXT AS cnt FROM sales`);
    const saleNumber = `F001-${String(Number(saleCount[0].cnt) + 1).padStart(8, '0')}`;

    await this.ds.query(
      `INSERT INTO sales (sale_number, sale_date, client_id, sale_type_id, sub_total, igv, total, status, payment_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', 'pending', $8)`,
      [saleNumber, today, invoice.clientId, saleTypeRow?.sale_type_id ?? null,
       invoice.subTotal, invoice.igv, invoice.total, req.user?.email ?? 'system'],
    );

    await this.repo.update(id, { lastBilledDate: today, nextBillingDate: nextDate });
    return {
      message:   'Factura generada',
      saleNumber,
      client:    clientRow?.client_description,
      total:     invoice.total,
      nextDate,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.repo.update(id, { status: 'cancelled' });
  }
}
