import { Test } from '@nestjs/testing';
import { Money } from '../../shared/domain/money.value-object';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import {
  CreditNoteProductNotInSaleError,
  CreditNoteSaleNotFoundError,
} from '../domain/credit-note.errors';
import {
  CREDIT_NOTE_CATALOG,
  CREDIT_NOTE_REPOSITORY,
} from '../domain/credit-note.repository';
import { CreateCreditNoteUseCase } from './create-credit-note.use-case';

const SALE_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const PROD_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const WH_ID   = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const CN_ID   = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';

function makeFakeCreditNote() {
  return { id: { value: CN_ID }, lines: [] } as any;
}

describe('CreateCreditNoteUseCase', () => {
  let useCase: CreateCreditNoteUseCase;
  let creditNotes: { emit: jest.Mock };
  let catalogo: { saleExists: jest.Mock; saleLinesMap: jest.Mock };
  let stockWriter: { insertMovements: jest.Mock };

  beforeEach(async () => {
    creditNotes = { emit: jest.fn() };
    catalogo    = { saleExists: jest.fn(), saleLinesMap: jest.fn() };
    stockWriter = { insertMovements: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CreateCreditNoteUseCase,
        { provide: CREDIT_NOTE_REPOSITORY, useValue: creditNotes },
        { provide: CREDIT_NOTE_CATALOG,    useValue: catalogo },
        { provide: STOCK_WRITER,           useValue: stockWriter },
      ],
    }).compile();

    useCase = module.get(CreateCreditNoteUseCase);
  });

  it('throws CreditNoteSaleNotFoundError when sale does not exist', async () => {
    catalogo.saleExists.mockResolvedValue(false);

    await expect(
      useCase.execute({
        saleId: SALE_ID,
        reason: 'devolucion',
        creditNoteDetails: [{ productId: PROD_ID, quantity: 1 }],
      }),
    ).rejects.toThrow(CreditNoteSaleNotFoundError);

    expect(catalogo.saleLinesMap).not.toHaveBeenCalled();
  });

  it('throws CreditNoteProductNotInSaleError when product is not in sale', async () => {
    catalogo.saleExists.mockResolvedValue(true);
    catalogo.saleLinesMap.mockResolvedValue(new Map());

    await expect(
      useCase.execute({
        saleId: SALE_ID,
        reason: 'devolucion',
        creditNoteDetails: [{ productId: PROD_ID, quantity: 1 }],
      }),
    ).rejects.toThrow(CreditNoteProductNotInSaleError);
  });

  it('emits credit note and returns it without calling stock when no warehouseId', async () => {
    catalogo.saleExists.mockResolvedValue(true);
    catalogo.saleLinesMap.mockResolvedValue(
      new Map([[PROD_ID, { unitPrice: Money.fromCentimos(500) }]]),
    );
    const fakeCN = makeFakeCreditNote();
    creditNotes.emit.mockImplementation((_saleId: string, builder: (n: string) => any) =>
      Promise.resolve(builder('CN-001')),
    );

    const result = await useCase.execute({
      saleId: SALE_ID,
      reason: 'devolucion',
      creditNoteDetails: [{ productId: PROD_ID, quantity: 2 }],
    });

    expect(creditNotes.emit).toHaveBeenCalledWith(SALE_ID, expect.any(Function));
    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('inserts return_in movements when warehouseId is provided', async () => {
    catalogo.saleExists.mockResolvedValue(true);
    catalogo.saleLinesMap.mockResolvedValue(
      new Map([[PROD_ID, { unitPrice: Money.fromCentimos(500) }]]),
    );
    creditNotes.emit.mockImplementation((_saleId: string, builder: (n: string) => any) =>
      Promise.resolve(builder('CN-001')),
    );
    stockWriter.insertMovements.mockResolvedValue(undefined);

    await useCase.execute({
      saleId: SALE_ID,
      reason: 'devolucion',
      warehouseId: WH_ID,
      creditNoteDetails: [{ productId: PROD_ID, quantity: 3 }],
    });

    expect(stockWriter.insertMovements).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId:    PROD_ID,
          warehouseId:  WH_ID,
          movementType: 'return_in',
          quantity:     3,
        }),
      ]),
    );
  });
});
