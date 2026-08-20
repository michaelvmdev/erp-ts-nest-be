import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ContractEntity } from '../orm/contract.entity';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('contracts')
export class ContractsController {
  constructor(
    @InjectRepository(ContractEntity) private readonly repo: Repository<ContractEntity>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get()
  @ApiQuery({ name: 'status',   required: false })
  @ApiQuery({ name: 'type',     required: false })
  @ApiQuery({ name: 'expiring', required: false, description: 'días para vencer' })
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'limit',    required: false })
  async list(
    @Query('status')   status?: string,
    @Query('type')     type?: string,
    @Query('expiring') expiring?: string,
    @Query('page')     page  = '1',
    @Query('limit')    limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (status) where.status = status;
    if (type)   where.type   = type;
    if (expiring) {
      const days = Number(expiring) || 30;
      const limit = new Date();
      limit.setDate(limit.getDate() + days);
      where.endDate = LessThanOrEqual(limit.toISOString().slice(0, 10));
    }
    const [items, total] = await this.repo.findAndCount({
      where, order: { endDate: 'ASC', createdAt: 'DESC' }, skip, take,
    });
    return { items, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Contratos por vencer en los próximos N días' })
  @ApiQuery({ name: 'days', required: false })
  async expiringSoon(@Query('days') days = '30') {
    const d = Number(days) || 30;
    const today = new Date().toISOString().slice(0, 10);
    const limit = new Date(); limit.setDate(limit.getDate() + d);
    const limitStr = limit.toISOString().slice(0, 10);
    return this.repo.find({
      where: { status: 'active', endDate: Between(today, limitStr), deletedAt: IsNull() },
      order: { endDate: 'ASC' },
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.findOneOrFail({ where: { contractId: id, deletedAt: IsNull() } });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Partial<ContractEntity>, @Req() req: any) {
    if (!body.contractNumber) {
      const count = await this.repo.count();
      body.contractNumber = `CONT-${String(count + 1).padStart(6, '0')}`;
    }
    const entity = this.repo.create({ ...body, createdBy: req.user?.email ?? 'system' });
    return this.repo.save(entity);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<ContractEntity>) {
    await this.repo.update(id, body);
    return this.repo.findOneOrFail({ where: { contractId: id } });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.repo.softDelete(id);
  }
}
