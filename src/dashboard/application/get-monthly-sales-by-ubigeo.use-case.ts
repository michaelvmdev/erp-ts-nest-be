import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  MonthlyAmount,
  UbigeoFilter,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';
import { YearPeriod } from '../domain/year-period';

@Injectable()
export class GetMonthlySalesByUbigeoUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(year: number, ubigeo: UbigeoFilter): Promise<MonthlyAmount[]> {
    return this.dashboard.monthlySalesByUbigeo(YearPeriod.of(year), ubigeo);
  }
}
