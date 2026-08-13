import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { PurchaseOrderLine } from './purchase-order-line';
import { PurchaseOrder } from './purchase-order';
import {
  InvalidPurchaseOrderError,
  PurchaseOrderStatusTransitionError,
} from './purchase-order.errors';
import { PurchaseOrderId } from './value-objects/purchase-order-id.value-object';

const uuid1 = '11111111-1111-4111-a111-111111111111';
const uuid2 = '22222222-2222-4222-a222-222222222222';

function makeLine(productUuid = uuid1, qty = 5, centimos = 1000): PurchaseOrderLine {
  return PurchaseOrderLine.of({
    item: 1,
    productId: ProductId.of(productUuid),
    quantityOrdered: qty,
    quantityReceived: 0,
    unitPrice: Money.fromCentimos(centimos),
  });
}

function makeOrder(lines?: PurchaseOrderLine[]): PurchaseOrder {
  return PurchaseOrder.create({
    id: PurchaseOrderId.of(uuid1),
    supplierId: uuid2,
    date: '2026-08-13',
    lines: lines ?? [makeLine()],
  });
}

describe('PurchaseOrder domain', () => {
  describe('create', () => {
    it('starts in pending status', () => {
      expect(makeOrder().status).toBe('pending');
    });

    it('rejects invalid date format', () => {
      expect(() =>
        PurchaseOrder.create({
          id: PurchaseOrderId.of(uuid1),
          supplierId: uuid2,
          date: '13-08-2026',
          lines: [makeLine()],
        }),
      ).toThrow(InvalidPurchaseOrderError);
    });

    it('rejects empty lines', () => {
      expect(() =>
        PurchaseOrder.create({
          id: PurchaseOrderId.of(uuid1),
          supplierId: uuid2,
          date: '2026-08-13',
          lines: [],
        }),
      ).toThrow(InvalidPurchaseOrderError);
    });

    it('rejects duplicate products', () => {
      const line1 = makeLine(uuid1);
      const line2 = PurchaseOrderLine.of({
        item: 2,
        productId: ProductId.of(uuid1),
        quantityOrdered: 3,
        quantityReceived: 0,
        unitPrice: Money.fromCentimos(500),
      });
      expect(() =>
        PurchaseOrder.create({
          id: PurchaseOrderId.of(uuid1),
          supplierId: uuid2,
          date: '2026-08-13',
          lines: [line1, line2],
        }),
      ).toThrow(InvalidPurchaseOrderError);
    });
  });

  describe('totals', () => {
    it('calculates subtotal, igv and total correctly', () => {
      const order = makeOrder([makeLine(uuid1, 5, 1000)]);
      expect(order.subTotal.centimos).toBe(5000);
      expect(order.igv.centimos).toBe(Math.round(5000 * 0.18));
      expect(order.total.centimos).toBe(order.subTotal.centimos + order.igv.centimos);
    });
  });

  describe('transitionTo', () => {
    it('allows pending → received', () => {
      const order = makeOrder();
      order.transitionTo('received');
      expect(order.status).toBe('received');
    });

    it('allows pending → cancelled', () => {
      const order = makeOrder();
      order.transitionTo('cancelled');
      expect(order.status).toBe('cancelled');
    });

    it('throws when transitioning from terminal state', () => {
      const order = makeOrder();
      order.transitionTo('received');
      expect(() => order.transitionTo('cancelled')).toThrow(
        PurchaseOrderStatusTransitionError,
      );
    });

    it('throws on cancelled → received', () => {
      const order = PurchaseOrder.rehydrate({
        id: PurchaseOrderId.of(uuid1),
        supplierId: uuid2,
        date: '2026-08-13',
        status: 'cancelled',
        notes: null,
        lines: [makeLine()],
      });
      expect(() => order.transitionTo('received')).toThrow(
        PurchaseOrderStatusTransitionError,
      );
    });
  });
});
