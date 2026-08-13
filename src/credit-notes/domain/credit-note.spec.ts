import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { CreditNoteLine } from './credit-note-line';
import { CreditNote } from './credit-note';
import { InvalidCreditNoteError } from './credit-note.errors';
import { CreditNoteId } from './value-objects/credit-note-id.value-object';

const CN_UUID    = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const SALE_UUID  = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const PROD_UUID  = 'cccccccc-cccc-4ccc-accc-cccccccccccc';
const PROD_UUID2 = 'dddddddd-dddd-4ddd-addd-dddddddddddd';

function makeLine(productUuid = PROD_UUID, item = 1, qty = 2): CreditNoteLine {
  return CreditNoteLine.of({
    item,
    productId: ProductId.of(productUuid),
    quantity: qty,
    unitPrice: Money.fromCentimos(1000),
  });
}

function makeCreditNote(lines?: CreditNoteLine[]): CreditNote {
  return CreditNote.create({
    id: CreditNoteId.of(CN_UUID),
    saleId: SALE_UUID,
    number: 'CN-001',
    date: '2026-08-13',
    hour: '10:30:00',
    reason: 'Devolucion de producto defectuoso',
    lines: lines ?? [makeLine()],
  });
}

describe('CreditNote domain', () => {
  describe('create', () => {
    it('creates a valid credit note', () => {
      const cn = makeCreditNote();
      expect(cn.number).toBe('CN-001');
      expect(cn.reason).toBe('Devolucion de producto defectuoso');
    });

    it('rejects invalid date format', () => {
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '13/08/2026',
          hour: '10:30:00',
          reason: 'Motivo',
          lines: [makeLine()],
        }),
      ).toThrow(InvalidCreditNoteError);
    });

    it('rejects invalid date that does not exist in the calendar', () => {
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '2026-02-30',
          hour: '10:30:00',
          reason: 'Motivo',
          lines: [makeLine()],
        }),
      ).toThrow(InvalidCreditNoteError);
    });

    it('rejects invalid hour format', () => {
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '2026-08-13',
          hour: '25:00:00',
          reason: 'Motivo',
          lines: [makeLine()],
        }),
      ).toThrow(InvalidCreditNoteError);
    });

    it('rejects blank reason', () => {
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '2026-08-13',
          hour: '10:30:00',
          reason: '   ',
          lines: [makeLine()],
        }),
      ).toThrow(InvalidCreditNoteError);
    });

    it('rejects empty lines', () => {
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '2026-08-13',
          hour: '10:30:00',
          reason: 'Motivo valido',
          lines: [],
        }),
      ).toThrow(InvalidCreditNoteError);
    });

    it('rejects duplicate products across lines', () => {
      const l1 = makeLine(PROD_UUID, 1, 2);
      const l2 = makeLine(PROD_UUID, 2, 1);
      expect(() =>
        CreditNote.create({
          id: CreditNoteId.of(CN_UUID),
          saleId: SALE_UUID,
          number: 'CN-001',
          date: '2026-08-13',
          hour: '10:30:00',
          reason: 'Motivo valido',
          lines: [l1, l2],
        }),
      ).toThrow(InvalidCreditNoteError);
    });
  });

  describe('totals', () => {
    it('calculates subtotal igv and total correctly', () => {
      const l1 = makeLine(PROD_UUID,  1, 2); // 2 * 1000 = 2000
      const l2 = makeLine(PROD_UUID2, 2, 3); // 3 * 1000 = 3000
      const cn = makeCreditNote([l1, l2]);
      expect(cn.subTotal.centimos).toBe(5000);
      expect(cn.igv.centimos).toBe(Math.round(5000 * 0.18));
      expect(cn.total.centimos).toBe(cn.subTotal.centimos + cn.igv.centimos);
    });
  });
});
