import { Inject, Injectable } from '@nestjs/common';
import { InvalidInputError } from '../../shared/domain/domain.error';
import { STOCK_WRITER } from '../domain/stock-writer';
import type { StockWriter } from '../domain/stock-writer';
import { NotifyStockAlertsUseCase } from './notify-stock-alerts.use-case';

export class SameWarehouseTransferError extends InvalidInputError {
  readonly code = 'SAME_WAREHOUSE_TRANSFER';
  constructor() {
    super('El almacen de origen y destino deben ser distintos.');
  }
}

export interface TransferStockCommand {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  notes?: string;
}

@Injectable()
export class TransferStockUseCase {
  constructor(
    @Inject(STOCK_WRITER)
    private readonly stockWriter: StockWriter,
    private readonly notifyAlerts: NotifyStockAlertsUseCase,
  ) {}

  async execute(command: TransferStockCommand): Promise<void> {
    if (command.sourceWarehouseId === command.destinationWarehouseId) {
      throw new SameWarehouseTransferError();
    }

    const referenceId = `transfer-${Date.now()}`;

    await this.stockWriter.insertMovements([
      {
        productId:    command.productId,
        warehouseId:  command.sourceWarehouseId,
        movementType: 'transfer_out',
        quantity:     -Math.abs(command.quantity),
        unitCost:     null,
        referenceId,
      },
      {
        productId:    command.productId,
        warehouseId:  command.destinationWarehouseId,
        movementType: 'transfer_in',
        quantity:     Math.abs(command.quantity),
        unitCost:     null,
        referenceId,
      },
    ]);

    void this.notifyAlerts.execute([command.productId]);
  }
}
