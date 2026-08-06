import { Inject, Injectable } from '@nestjs/common';
import { MonthPeriod } from '../domain/month-period';
import {
  DASHBOARD_REPOSITORY,
  TopPurchasedProduct,
} from '../domain/dashboard.repository';
import type { DashboardRepository } from '../domain/dashboard.repository';

@Injectable()
export class GetTopPurchasedProductUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboard: DashboardRepository,
  ) {}

  execute(): Promise<TopPurchasedProduct | null> {
    return this.dashboard.topPurchasedProduct(MonthPeriod.current());
  }
}
