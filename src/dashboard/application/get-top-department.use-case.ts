import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import {
  DASHBOARD_REPOSITORY,
  TopDepartment,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTopDepartmentUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TopDepartment | null> {
    return this.dashboard.topDepartment(MonthPeriod.current());
  }
}
