import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  MonthlyAmount,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';
import { YearPeriod } from '../domain/year-period';

@Injectable()
export class GetMonthlySalesByCategoryUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(year: number, categoryId: string): Promise<MonthlyAmount[]> {
    return this.dashboard.monthlySalesByCategory(YearPeriod.of(year), categoryId);
  }
}
