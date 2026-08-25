import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CostCenterOrmEntity } from './infrastructure/persistence/cost-center.orm-entity';

@Injectable()
export class CostCentersService {
  constructor(
    @InjectRepository(CostCenterOrmEntity)
    private readonly repo: Repository<CostCenterOrmEntity>,
  ) {}

  async list(active?: boolean) {
    const where = active !== undefined ? { active } : {};
    const items = await this.repo.find({ where, order: { code: 'ASC' } });
    return items.map(this.map);
  }

  async findById(costCenterId: string) {
    const c = await this.repo.findOne({ where: { costCenterId } });
    if (!c) throw new NotFoundException(`Centro de costo ${costCenterId} no encontrado.`);
    return this.map(c);
  }

  async create(dto: { code: string; name: string; parentId?: string }) {
    const existing = await this.repo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Código ${dto.code} ya existe.`);
    const c = new CostCenterOrmEntity();
    c.costCenterId = randomUUID();
    c.code         = dto.code;
    c.name         = dto.name;
    c.parentId     = dto.parentId ?? null;
    c.active       = true;
    await this.repo.save(c);
    return this.map(c);
  }

  async update(costCenterId: string, dto: { name?: string; active?: boolean }) {
    const c = await this.repo.findOne({ where: { costCenterId } });
    if (!c) throw new NotFoundException(`Centro de costo ${costCenterId} no encontrado.`);
    if (dto.name   !== undefined) c.name   = dto.name;
    if (dto.active !== undefined) c.active = dto.active;
    await this.repo.save(c);
    return this.map(c);
  }

  private map(c: CostCenterOrmEntity) {
    return {
      costCenterId: c.costCenterId,
      code:         c.code,
      name:         c.name,
      parentId:     c.parentId,
      active:       c.active,
      createdAt:    c.createdAt,
    };
  }
}
