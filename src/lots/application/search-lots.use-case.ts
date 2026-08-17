import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository, LotSearchCriteria, LotSummary } from '../domain/lot.repository';

@Injectable()
export class SearchLotsUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(criteria: LotSearchCriteria): Promise<Page<LotSummary>> {
    return this.lots.search(criteria);
  }
}
