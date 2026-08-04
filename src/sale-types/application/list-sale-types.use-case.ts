import { Inject, Injectable } from '@nestjs/common';
import { SaleType } from '../domain/sale-type';
import { SALE_TYPE_REPOSITORY } from '../domain/sale-type.repository';
import type { SaleTypeRepository } from '../domain/sale-type.repository';

@Injectable()
export class ListSaleTypesUseCase {
  constructor(
    @Inject(SALE_TYPE_REPOSITORY)
    private readonly saleTypes: SaleTypeRepository,
  ) {}

  execute(): Promise<SaleType[]> {
    return this.saleTypes.findAll();
  }
}
