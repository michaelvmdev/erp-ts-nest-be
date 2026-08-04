import { Inject, Injectable } from '@nestjs/common';
import { Sale } from '../domain/sale';
import { SaleNotFoundError } from '../domain/sale.errors';
import { SALE_REPOSITORY } from '../domain/sale.repository';
import type { SaleRepository } from '../domain/sale.repository';
import { SaleId } from '../domain/value-objects/sale-identifiers.value-object';

@Injectable()
export class FindSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly sales: SaleRepository,
  ) {}

  async execute(rawSaleId: string): Promise<Sale> {
    const id = SaleId.of(rawSaleId);

    const sale = await this.sales.findById(id);
    if (!sale) {
      throw new SaleNotFoundError(id.value);
    }
    return sale;
  }
}
