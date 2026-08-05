import { Supplier } from '../../domain/supplier';
import { SupplierDescription } from '../../domain/value-objects/supplier-description.value-object';
import { SupplierId } from '../../domain/value-objects/supplier-id.value-object';
import { SupplierRuc } from '../../domain/value-objects/supplier-ruc.value-object';
import { SupplierOrmEntity } from './supplier.orm-entity';

export class SupplierMapper {
  static toDomain(row: SupplierOrmEntity): Supplier {
    return Supplier.rehydrate({
      id: SupplierId.of(row.supplierId),
      description: SupplierDescription.of(row.supplierDescription),
      ruc: SupplierRuc.of(row.supplierRuc),
      active: row.supplierActive,
    });
  }

  static toPersistence(supplier: Supplier): SupplierOrmEntity {
    const snapshot = supplier.toSnapshot();

    const row = new SupplierOrmEntity();
    row.supplierId = snapshot.id;
    row.supplierDescription = snapshot.description;
    row.supplierRuc = snapshot.ruc;
    row.supplierActive = snapshot.active;
    return row;
  }
}
