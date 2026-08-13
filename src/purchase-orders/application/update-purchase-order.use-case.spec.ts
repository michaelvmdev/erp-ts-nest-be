import { Test } from '@nestjs/testing';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import { PurchaseOrderLine } from '../domain/purchase-order-line';
import { PurchaseOrder } from '../domain/purchase-order';
import { PurchaseOrderNotFoundError } from '../domain/purchase-order.errors';
import { PURCHASE_ORDER_REPOSITORY } from '../domain/purchase-order.repository';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id.value-object';
import { UpdatePurchaseOrderUseCase } from './update-purchase-order.use-case';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const PROD_ID  = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const SUPP_ID  = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const WH_ID    = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';

function makePendingOrder(): PurchaseOrder {
  return PurchaseOrder.rehydrate({
    id: PurchaseOrderId.of(ORDER_ID),
    supplierId: SUPP_ID,
    date: '2026-08-13',
    status: 'pending',
    notes: null,
    lines: [
      PurchaseOrderLine.of({
        item: 1,
        productId: ProductId.of(PROD_ID),
        quantityOrdered: 10,
        quantityReceived: 0,
        unitPrice: Money.fromCentimos(2000),
      }),
    ],
  });
}

describe('UpdatePurchaseOrderUseCase', () => {
  let useCase: UpdatePurchaseOrderUseCase;
  let ordersRepo: { findById: jest.Mock; update: jest.Mock };
  let stockWriter: { insertMovements: jest.Mock };

  beforeEach(async () => {
    ordersRepo  = { findById: jest.fn(), update: jest.fn() };
    stockWriter = { insertMovements: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        UpdatePurchaseOrderUseCase,
        { provide: PURCHASE_ORDER_REPOSITORY, useValue: ordersRepo },
        { provide: STOCK_WRITER, useValue: stockWriter },
      ],
    }).compile();

    useCase = module.get(UpdatePurchaseOrderUseCase);
  });

  it('throws PurchaseOrderNotFoundError when order does not exist', async () => {
    ordersRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(ORDER_ID, { status: 'received' })).rejects.toThrow(
      PurchaseOrderNotFoundError,
    );
    expect(ordersRepo.update).not.toHaveBeenCalled();
  });

  it('transitions status and persists without inserting stock when no warehouseId', async () => {
    const order = makePendingOrder();
    ordersRepo.findById.mockResolvedValue(order);
    ordersRepo.update.mockResolvedValue(undefined);

    await useCase.execute(ORDER_ID, { status: 'received' });

    expect(order.status).toBe('received');
    expect(ordersRepo.update).toHaveBeenCalledWith(order);
    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
  });

  it('inserts purchase_in movements when transitioning to received with warehouseId', async () => {
    const order = makePendingOrder();
    ordersRepo.findById.mockResolvedValue(order);
    ordersRepo.update.mockResolvedValue(undefined);
    stockWriter.insertMovements.mockResolvedValue(undefined);

    await useCase.execute(ORDER_ID, { status: 'received', warehouseId: WH_ID });

    expect(stockWriter.insertMovements).toHaveBeenCalledWith([
      expect.objectContaining({
        productId:    PROD_ID,
        warehouseId:  WH_ID,
        movementType: 'purchase_in',
        quantity:     10,
        referenceId:  ORDER_ID,
      }),
    ]);
  });

  it('does not insert stock movements when order was already received', async () => {
    const order = PurchaseOrder.rehydrate({
      id: PurchaseOrderId.of(ORDER_ID),
      supplierId: SUPP_ID,
      date: '2026-08-13',
      status: 'received',
      notes: null,
      lines: [
        PurchaseOrderLine.of({
          item: 1,
          productId: ProductId.of(PROD_ID),
          quantityOrdered: 10,
          quantityReceived: 10,
          unitPrice: Money.fromCentimos(2000),
        }),
      ],
    });
    ordersRepo.findById.mockResolvedValue(order);
    ordersRepo.update.mockResolvedValue(undefined);

    await useCase.execute(ORDER_ID, { notes: 'updated note', warehouseId: WH_ID });

    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
  });

  it('updates notes without touching status or stock', async () => {
    const order = makePendingOrder();
    ordersRepo.findById.mockResolvedValue(order);
    ordersRepo.update.mockResolvedValue(undefined);

    await useCase.execute(ORDER_ID, { notes: 'new note' });

    expect(order.status).toBe('pending');
    expect(order.notes).toBe('new note');
    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
  });
});
