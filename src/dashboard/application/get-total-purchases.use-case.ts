import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import {
  DASHBOARD_REPOSITORY,
  TotalPurchases,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTotalPurchasesUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TotalPurchases> {
    return this.dashboard.totalPurchases(MonthPeriod.current());
  }
}
