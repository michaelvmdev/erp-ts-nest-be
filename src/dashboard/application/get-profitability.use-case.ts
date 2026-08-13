import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_REPOSITORY, ProfitabilityRow } from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetProfitabilityUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(dateFrom?: string, dateTo?: string): Promise<ProfitabilityRow[]> {
    return this.dashboard.profitability(dateFrom, dateTo);
  }
}
