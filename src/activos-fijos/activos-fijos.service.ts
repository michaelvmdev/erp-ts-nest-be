import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { FixedAssetOrmEntity } from './infrastructure/persistence/fixed-asset.orm-entity';
import { AssetDepreciationOrmEntity } from './infrastructure/persistence/asset-depreciation.orm-entity';
import { AssetMaintenanceOrmEntity } from './infrastructure/persistence/asset-maintenance.orm-entity';

@Injectable()
export class ActivosFijosService {
  constructor(
    @InjectRepository(FixedAssetOrmEntity)
    private readonly assetsRepo: Repository<FixedAssetOrmEntity>,
    @InjectRepository(AssetDepreciationOrmEntity)
    private readonly deprRepo: Repository<AssetDepreciationOrmEntity>,
    @InjectRepository(AssetMaintenanceOrmEntity)
    private readonly maintRepo: Repository<AssetMaintenanceOrmEntity>,
  ) {}

  // ── Assets ───────────────────────────────────────────────────────────────

  async search(status?: string, category?: string, page = 1, limit = 20) {
    const qb = this.assetsRepo.createQueryBuilder('a').orderBy('a.code', 'ASC');
    if (status)   qb.andWhere('a.status = :status',     { status });
    if (category) qb.andWhere('a.category = :category', { category });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map(this.mapAsset),
      meta:  { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(assetId: string) {
    const a = await this.assetsRepo.findOne({ where: { assetId } });
    if (!a) throw new NotFoundException(`Activo ${assetId} no encontrado.`);
    return this.mapAsset(a);
  }

  async create(dto: {
    code: string; name: string; description?: string; category: string;
    acquisitionDate: string; acquisitionCost: number; residualValue?: number;
    usefulLifeYears: number; depreciationMethod?: string;
    location?: string; serialNumber?: string; notes?: string;
  }): Promise<FixedAssetOrmEntity> {
    const existing = await this.assetsRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`El código ${dto.code} ya existe.`);

    const a = new FixedAssetOrmEntity();
    a.assetId             = randomUUID();
    a.code                = dto.code;
    a.name                = dto.name;
    a.description         = dto.description ?? null;
    a.category            = dto.category;
    a.acquisitionDate     = dto.acquisitionDate;
    a.acquisitionCost     = dto.acquisitionCost.toFixed(2);
    a.residualValue       = (dto.residualValue ?? 0).toFixed(2);
    a.usefulLifeYears     = dto.usefulLifeYears;
    a.depreciationMethod  = dto.depreciationMethod ?? 'linear';
    a.status              = 'active';
    a.location            = dto.location ?? null;
    a.serialNumber        = dto.serialNumber ?? null;
    a.notes               = dto.notes ?? null;
    return this.assetsRepo.save(a);
  }

  async dispose(assetId: string) {
    const a = await this.assetsRepo.findOne({ where: { assetId } });
    if (!a) throw new NotFoundException(`Activo ${assetId} no encontrado.`);
    a.status = 'disposed';
    return this.assetsRepo.save(a);
  }

  // ── Depreciation ─────────────────────────────────────────────────────────

  calculateLinearDepreciation(asset: {
    acquisitionCost: number; residualValue: number; usefulLifeYears: number;
  }) {
    const depreciableAmount = asset.acquisitionCost - asset.residualValue;
    return depreciableAmount / (asset.usefulLifeYears * 12); // monthly
  }

  async runDepreciation(period: string): Promise<{ processed: number; skipped: number }> {
    const assets = await this.assetsRepo.find({ where: { status: 'active' } });
    let processed = 0, skipped = 0;

    for (const a of assets) {
      const existing = await this.deprRepo.findOne({ where: { assetId: a.assetId, period } });
      if (existing) { skipped++; continue; }

      const cost     = parseFloat(a.acquisitionCost);
      const residual = parseFloat(a.residualValue);
      const monthly  = this.calculateLinearDepreciation({ acquisitionCost: cost, residualValue: residual, usefulLifeYears: a.usefulLifeYears });

      const accPrev = await this.deprRepo
        .createQueryBuilder('d')
        .select('SUM(d.amount)', 'total')
        .where('d.asset_id = :id', { id: a.assetId })
        .getRawOne<{ total: string | null }>();

      const accumulated = parseFloat(accPrev?.total ?? '0') + monthly;
      const bookValue   = Math.max(residual, cost - accumulated);

      if (bookValue <= residual) { skipped++; continue; }

      const d = new AssetDepreciationOrmEntity();
      d.depreciationId = randomUUID();
      d.assetId        = a.assetId;
      d.period         = period;
      d.amount         = monthly.toFixed(2);
      d.accumulated    = accumulated.toFixed(2);
      d.bookValue      = bookValue.toFixed(2);
      await this.deprRepo.save(d);
      processed++;

      if (bookValue <= residual) {
        a.status = 'fully_depreciated';
        await this.assetsRepo.save(a);
      }
    }
    return { processed, skipped };
  }

  async getDepreciation(assetId: string) {
    return this.deprRepo.find({ where: { assetId }, order: { period: 'DESC' } });
  }

  // ── Maintenance ──────────────────────────────────────────────────────────

  async addMaintenance(dto: {
    assetId: string; maintenanceDate: string; type: string;
    description: string; cost?: number; provider?: string; nextMaintenance?: string;
  }) {
    const a = await this.assetsRepo.findOne({ where: { assetId: dto.assetId } });
    if (!a) throw new NotFoundException(`Activo ${dto.assetId} no encontrado.`);

    const m = new AssetMaintenanceOrmEntity();
    m.maintenanceId    = randomUUID();
    m.assetId          = dto.assetId;
    m.maintenanceDate  = dto.maintenanceDate;
    m.type             = dto.type;
    m.description      = dto.description;
    m.cost             = (dto.cost ?? 0).toFixed(2);
    m.provider         = dto.provider ?? null;
    m.nextMaintenance  = dto.nextMaintenance ?? null;
    return this.maintRepo.save(m);
  }

  async getMaintenances(assetId: string) {
    return this.maintRepo.find({ where: { assetId }, order: { maintenanceDate: 'DESC' } });
  }

  private mapAsset(a: FixedAssetOrmEntity) {
    return {
      assetId:            a.assetId,
      code:               a.code,
      name:               a.name,
      description:        a.description,
      category:           a.category,
      acquisitionDate:    a.acquisitionDate,
      acquisitionCost:    parseFloat(a.acquisitionCost),
      residualValue:      parseFloat(a.residualValue),
      usefulLifeYears:    a.usefulLifeYears,
      depreciationMethod: a.depreciationMethod,
      status:             a.status,
      location:           a.location,
      serialNumber:       a.serialNumber,
      notes:              a.notes,
      createdAt:          a.createdAt,
    };
  }
}
