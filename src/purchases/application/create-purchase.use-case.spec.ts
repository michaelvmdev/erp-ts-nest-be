import { Test } from '@nestjs/testing';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import {
  InactivePurchaseSupplierError,
  PurchaseSupplierNotFoundError,
} from '../domain/purchase.errors';
import { PURCHASE_CATALOG, PURCHASE_REPOSITORY } from '../domain/purchase.repository';
import { CreatePurchaseUseCase } from './create-purchase.use-case';

const SUPPLIER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const PROD_ID     = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const WH_ID       = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

const BASE_CMD = {
  supplierId: SUPPLIER_ID,
  purchaseDate: '2024-01-10',
  purchaseHour: '09:30:00',
  purchaseDetails: [{ productId: PROD_ID, quantity: 5, unitPrice: 100 }],
};

describe('CreatePurchaseUseCase', () => {
  let useCase: CreatePurchaseUseCase;
  let purchaseRepo: { insert: jest.Mock };
  let catalog: {
    supplierState: jest.Mock;
    productsExist: jest.Mock;
  };
  let stockWriter: { insertMovements: jest.Mock };

  beforeEach(async () => {
    purchaseRepo = { insert: jest.fn() };
    catalog = {
      supplierState: jest.fn().mockResolvedValue({ active: true }),
      productsExist: jest.fn().mockResolvedValue(new Set([PROD_ID])),
    };
    stockWriter = { insertMovements: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CreatePurchaseUseCase,
        { provide: PURCHASE_REPOSITORY, useValue: purchaseRepo },
        { provide: PURCHASE_CATALOG,    useValue: catalog },
        { provide: STOCK_WRITER,        useValue: stockWriter },
      ],
    }).compile();

    useCase = module.get(CreatePurchaseUseCase);
  });

  it('throws PurchaseSupplierNotFoundError when supplier does not exist', async () => {
    catalog.supplierState.mockResolvedValue(null);

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(PurchaseSupplierNotFoundError);
    expect(purchaseRepo.insert).not.toHaveBeenCalled();
  });

  it('throws InactivePurchaseSupplierError when supplier is not active', async () => {
    catalog.supplierState.mockResolvedValue({ active: false });

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(InactivePurchaseSupplierError);
  });

  it('persists the purchase and returns it', async () => {
    purchaseRepo.insert.mockResolvedValue(undefined);

    const result = await useCase.execute(BASE_CMD);

    expect(purchaseRepo.insert).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('does not insert stock movements when no warehouseId', async () => {
    purchaseRepo.insert.mockResolvedValue(undefined);

    await useCase.execute(BASE_CMD);

    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
  });

  it('inserts purchase_in stock movements when warehouseId is provided', async () => {
    purchaseRepo.insert.mockResolvedValue(undefined);
    stockWriter.insertMovements.mockResolvedValue(undefined);

    await useCase.execute({ ...BASE_CMD, warehouseId: WH_ID });

    expect(stockWriter.insertMovements).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId:    PROD_ID,
          warehouseId:  WH_ID,
          movementType: 'purchase_in',
          quantity:     5,
        }),
      ]),
    );
  });
});
