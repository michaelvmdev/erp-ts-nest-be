import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { Supplier } from '../domain/supplier';
import { SupplierSearchCriteria } from '../domain/supplier-search.criteria';
import { SUPPLIER_REPOSITORY } from '../domain/supplier.repository';
import type { SupplierRepository } from '../domain/supplier.repository';
import { ListSuppliersQuery } from './supplier.commands';

@Injectable()
export class ListSuppliersUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(query: ListSuppliersQuery): Promise<Page<Supplier>> {
    const criteria = SupplierSearchCriteria.of({
      description: query.supplierDescription,
      ruc: query.supplierRuc,
      active: query.supplierActive ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.suppliers.search(criteria);
  }
}
