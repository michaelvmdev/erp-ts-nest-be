import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import {
  DASHBOARD_REPOSITORY,
  TopSupplier,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTopSupplierUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TopSupplier | null> {
    return this.dashboard.topSupplier(MonthPeriod.current());
  }
}
