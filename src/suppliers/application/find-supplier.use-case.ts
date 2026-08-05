import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from '../domain/supplier';
import { SupplierNotFoundError } from '../domain/supplier.errors';
import { SUPPLIER_REPOSITORY } from '../domain/supplier.repository';
import type { SupplierRepository } from '../domain/supplier.repository';
import { SupplierId } from '../domain/value-objects/supplier-id.value-object';

@Injectable()
export class FindSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(rawSupplierId: string): Promise<Supplier> {
    const id = SupplierId.of(rawSupplierId);

    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError(id.value);
    }
    return supplier;
  }
}
