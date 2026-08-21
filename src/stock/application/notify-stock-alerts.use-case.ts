import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../../notifications/notifications.service';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import type { StockRepository } from '../domain/stock.repository';

@Injectable()
export class NotifyStockAlertsUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepo: StockRepository,
    private readonly notifications: NotificationsService,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async execute(productIds?: string[]): Promise<void> {
    const alerts = await this.stockRepo.findLowStock();
    if (alerts.length === 0) return;

    const filtered = productIds
      ? alerts.filter((a) => productIds.includes(a.productId))
      : alerts;
    if (filtered.length === 0) return;

    const users: Array<{ userEmail: string }> = await this.ds.query(
      `SELECT user_email AS "userEmail" FROM users WHERE user_active = true`,
    );
    const emails = users.map((u) => u.userEmail);
    if (emails.length === 0) return;

    for (const alert of filtered) {
      const title = `Stock bajo: ${alert.productName}`;
      const body =
        `Almacen ${alert.warehouseCode}: ${alert.currentStock} uds. ` +
        `(mínimo ${alert.minimumStock}, déficit ${alert.deficit})`;
      for (const email of emails) {
        await this.notifications.notify(email, 'stock_alert', title, body);
      }
    }
  }
}
