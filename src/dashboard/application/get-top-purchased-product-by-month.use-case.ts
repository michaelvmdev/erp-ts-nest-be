import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  MonthlyTopPurchasedProduct,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';
import { YearPeriod } from '../domain/year-period';

@Injectable()
export class GetTopPurchasedProductByMonthUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(year: number): Promise<MonthlyTopPurchasedProduct[]> {
    return this.dashboard.topPurchasedProductByMonth(YearPeriod.of(year));
  }
}
