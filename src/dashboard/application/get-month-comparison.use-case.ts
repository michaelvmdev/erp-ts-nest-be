import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_REPOSITORY, MonthComparison } from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetMonthComparisonUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(year: number, month: number): Promise<MonthComparison> {
    return this.dashboard.monthComparison(year, month);
  }
}
