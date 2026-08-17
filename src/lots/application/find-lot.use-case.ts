import { Inject, Injectable } from '@nestjs/common';
import { Lot } from '../domain/lot';
import { LotNotFoundError } from '../domain/lot.errors';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';
import { LotId } from '../domain/value-objects/lot-id.value-object';

@Injectable()
export class FindLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(id: string): Promise<Lot> {
    const lot = await this.lots.findById(LotId.of(id));
    if (!lot) throw new LotNotFoundError(id);
    return lot;
  }
}
