import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import {
  DASHBOARD_REPOSITORY,
  TopProduct,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTopProductUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TopProduct | null> {
    return this.dashboard.topProduct(MonthPeriod.current());
  }
}
