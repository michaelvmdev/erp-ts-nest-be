import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ExchangeRateEntity } from '../orm/exchange-rate.entity';

@ApiTags('exchange-rates')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(
    @InjectRepository(ExchangeRateEntity)
    private readonly repo: Repository<ExchangeRateEntity>,
  ) {}

  @Get('latest')
  @ApiOperation({ summary: 'Tipo de cambio más reciente para un par de monedas' })
  @ApiQuery({ name: 'from', example: 'USD', required: false })
  @ApiQuery({ name: 'to',   example: 'PEN', required: false })
  async latest(
    @Query('from') from = 'USD',
    @Query('to')   to   = 'PEN',
  ) {
    const row = await this.repo.findOne({
      where: { currencyFrom: from.toUpperCase(), currencyTo: to.toUpperCase() },
      order: { effectiveDate: 'DESC' },
    });
    if (!row) return { message: `No se encontró tipo de cambio ${from}/${to}` };
    return row;
  }

  @Get()
  @ApiOperation({ summary: 'Historial de tipos de cambio con filtros' })
  @ApiQuery({ name: 'from',      required: false })
  @ApiQuery({ name: 'to',        required: false })
  @ApiQuery({ name: 'dateFrom',  required: false })
  @ApiQuery({ name: 'dateTo',    required: false })
  @ApiQuery({ name: 'page',      required: false })
  @ApiQuery({ name: 'limit',     required: false })
  async list(
    @Query('from')     from?: string,
    @Query('to')       to?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
    @Query('page')     page = '1',
    @Query('limit')    limit = '30',
  ) {
    const take = Math.min(Number(limit) || 30, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const where: Record<string, unknown> = {};
    if (from) where.currencyFrom = from.toUpperCase();
    if (to)   where.currencyTo   = to.toUpperCase();
    if (dateFrom && dateTo) where.effectiveDate = Between(dateFrom, dateTo);

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
      skip,
      take,
    });

    return { items, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar tipo de cambio' })
  @ApiBody({
    schema: {
      example: {
        currencyFrom: 'USD', currencyTo: 'PEN',
        rate: 3.75, rateBuy: 3.73, rateSell: 3.77,
        effectiveDate: '2026-08-20', source: 'SUNAT',
      },
    },
  })
  async create(@Body() body: Partial<ExchangeRateEntity>, @Req() req: any) {
    const entity = this.repo.create({
      ...body,
      currencyFrom: body.currencyFrom?.toUpperCase() ?? 'USD',
      currencyTo:   body.currencyTo?.toUpperCase()   ?? 'PEN',
      createdBy:    req.user?.email ?? 'system',
    });
    return this.repo.save(entity);
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convertir un monto entre monedas usando el TC más reciente' })
  @ApiQuery({ name: 'amount', example: '100', description: 'Monto a convertir' })
  @ApiQuery({ name: 'from',   example: 'USD' })
  @ApiQuery({ name: 'to',     example: 'PEN' })
  async convert(
    @Query('amount') amount: string,
    @Query('from')   from = 'USD',
    @Query('to')     to   = 'PEN',
  ) {
    const amt = parseFloat(amount);
    if (isNaN(amt)) return { error: 'Monto inválido' };

    const row = await this.repo.findOne({
      where: { currencyFrom: from.toUpperCase(), currencyTo: to.toUpperCase() },
      order: { effectiveDate: 'DESC' },
    });

    if (!row) {
      // Intentar con la inversa
      const inv = await this.repo.findOne({
        where: { currencyFrom: to.toUpperCase(), currencyTo: from.toUpperCase() },
        order: { effectiveDate: 'DESC' },
      });
      if (!inv) return { error: `No hay tipo de cambio para ${from}/${to}` };
      const rate = 1 / parseFloat(inv.rate);
      return { from, to, amount: amt, rate: rate.toFixed(6), result: (amt * rate).toFixed(2), effectiveDate: inv.effectiveDate };
    }

    const rate = parseFloat(row.rate);
    return {
      from, to, amount: amt,
      rate:    rate.toFixed(6),
      rateBuy:  row.rateBuy  ? parseFloat(row.rateBuy).toFixed(6)  : null,
      rateSell: row.rateSell ? parseFloat(row.rateSell).toFixed(6) : null,
      result:  (amt * rate).toFixed(2),
      effectiveDate: row.effectiveDate,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un tipo de cambio' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.findOneOrFail({ where: { rateId: id } });
  }
}
