import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { CreditNoteLine } from './credit-note-line';
import { InvalidCreditNoteLineError } from './credit-note-line';

const PROD_UUID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

function makeLine(qty = 2, priceCentimos = 1000): CreditNoteLine {
  return CreditNoteLine.of({
    item: 1,
    productId: ProductId.of(PROD_UUID),
    quantity: qty,
    unitPrice: Money.fromCentimos(priceCentimos),
  });
}

describe('CreditNoteLine', () => {
  it('creates a valid line and computes partial correctly', () => {
    const line = makeLine(3, 500);
    expect(line.quantity).toBe(3);
    expect(line.partial.centimos).toBe(1500);
  });

  it('rejects item < 1', () => {
    expect(() =>
      CreditNoteLine.of({
        item: 0,
        productId: ProductId.of(PROD_UUID),
        quantity: 1,
        unitPrice: Money.fromCentimos(100),
      }),
    ).toThrow(InvalidCreditNoteLineError);
  });

  it('rejects quantity 0', () => {
    expect(() => makeLine(0)).toThrow(InvalidCreditNoteLineError);
  });

  it('rejects non-integer quantity', () => {
    expect(() => makeLine(1.5)).toThrow(InvalidCreditNoteLineError);
  });

  it('rejects quantity above MAX_QUANTITY', () => {
    expect(() => makeLine(CreditNoteLine.MAX_QUANTITY + 1)).toThrow(InvalidCreditNoteLineError);
  });
});
