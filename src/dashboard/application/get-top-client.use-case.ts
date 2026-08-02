import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import { DASHBOARD_REPOSITORY, TopClient } from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTopClientUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TopClient | null> {
    return this.dashboard.topClient(MonthPeriod.current());
  }
}
