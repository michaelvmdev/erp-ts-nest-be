import { Lot, LotStatus } from '../../domain/lot';
import { LotSummary } from '../../domain/lot.repository';
import { LotId } from '../../domain/value-objects/lot-id.value-object';
import { LotOrmEntity } from './lot.orm-entity';

export class LotMapper {
  static toDomain(row: LotOrmEntity): Lot {
    return Lot.rehydrate({
      id: LotId.of(row.lotId),
      lotNumber: row.lotNumber,
      productId: row.productId,
      warehouseId: row.warehouseId,
      manufacturingDate: row.manufacturingDate,
      expirationDate: row.expirationDate,
      initialQuantity: row.initialQuantity,
      currentQuantity: row.currentQuantity,
      status: row.status as LotStatus,
      notes: row.notes,
      createdAt: row.createdAt,
    });
  }

  static toSummary(
    row: LotOrmEntity & { productName: string; warehouseCode: string },
  ): LotSummary {
    return {
      id: row.lotId,
      lotNumber: row.lotNumber,
      productId: row.productId,
      productName: row.productName,
      warehouseId: row.warehouseId,
      warehouseCode: row.warehouseCode,
      expirationDate: row.expirationDate,
      initialQuantity: row.initialQuantity,
      currentQuantity: row.currentQuantity,
      status: row.status as LotStatus,
      createdAt: row.createdAt,
    };
  }

  static toPersistence(lot: Lot): Partial<LotOrmEntity> {
    const s = lot.toSnapshot();
    return {
      lotId: s.id,
      lotNumber: s.lotNumber,
      productId: s.productId,
      warehouseId: s.warehouseId,
      manufacturingDate: s.manufacturingDate,
      expirationDate: s.expirationDate,
      initialQuantity: s.initialQuantity,
      currentQuantity: s.currentQuantity,
      status: s.status,
      notes: s.notes,
    };
  }
}
