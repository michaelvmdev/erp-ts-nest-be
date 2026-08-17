import { Test } from '@nestjs/testing';
import { Money } from '../../shared/domain/money.value-object';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import {
  InactiveClientError,
  SaleClientNotFoundError,
  SaleDistrictNotFoundError,
  SaleTypeNotFoundError,
} from '../domain/sale.errors';
import { SALE_CATALOG, SALE_REPOSITORY } from '../domain/sale.repository';
import { SaleNumber } from '../domain/value-objects/sale-identifiers.value-object';
import { CreateSaleUseCase } from './create-sale.use-case';

const CLIENT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const PROD_ID   = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const WH_ID     = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

const BASE_CMD = {
  saleTypeId: 1,
  clientId: CLIENT_ID,
  districtId: '150101',
  saleDate: '2024-01-15',
  saleHour: '10:00:00',
  saleDetails: [{ productId: PROD_ID, quantity: 2 }],
};

function makeSale(overrides = {}) {
  return {
    id: { value: 'dddddddd-dddd-4ddd-dddd-dddddddddddd' },
    lines: [{ productId: { value: PROD_ID }, quantity: 2 }],
    ...overrides,
  };
}

describe('CreateSaleUseCase', () => {
  let useCase: CreateSaleUseCase;
  let saleRepo: { emit: jest.Mock };
  let catalog: {
    saleTypeCodeOf: jest.Mock;
    clientState: jest.Mock;
    districtExists: jest.Mock;
    productsState: jest.Mock;
  };
  let stockWriter: { insertMovements: jest.Mock };

  beforeEach(async () => {
    saleRepo = { emit: jest.fn() };
    catalog = {
      saleTypeCodeOf: jest.fn().mockResolvedValue('FAC'),
      clientState: jest.fn().mockResolvedValue({ active: true }),
      districtExists: jest.fn().mockResolvedValue(true),
      productsState: jest.fn().mockResolvedValue(
        new Map([[PROD_ID, { active: true, price: Money.fromCentimos(5000) }]]),
      ),
    };
    stockWriter = { insertMovements: jest.fn() };

    saleRepo.emit.mockImplementation((_typeId: number, builder: (n: SaleNumber) => any) =>
      Promise.resolve(builder(SaleNumber.emitir('FAC', 1))),
    );

    const module = await Test.createTestingModule({
      providers: [
        CreateSaleUseCase,
        { provide: SALE_REPOSITORY, useValue: saleRepo },
        { provide: SALE_CATALOG,    useValue: catalog },
        { provide: STOCK_WRITER,    useValue: stockWriter },
      ],
    }).compile();

    useCase = module.get(CreateSaleUseCase);
  });

  it('throws SaleTypeNotFoundError when sale type does not exist', async () => {
    catalog.saleTypeCodeOf.mockResolvedValue(null);

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(SaleTypeNotFoundError);
    expect(catalog.clientState).not.toHaveBeenCalled();
  });

  it('throws SaleClientNotFoundError when client does not exist', async () => {
    catalog.clientState.mockResolvedValue(null);

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(SaleClientNotFoundError);
  });

  it('throws InactiveClientError when client is not active', async () => {
    catalog.clientState.mockResolvedValue({ active: false });

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(InactiveClientError);
  });

  it('throws SaleDistrictNotFoundError when district does not exist', async () => {
    catalog.districtExists.mockResolvedValue(false);

    await expect(useCase.execute(BASE_CMD)).rejects.toThrow(SaleDistrictNotFoundError);
  });

  it('calls sale repository emit and returns the created sale', async () => {
    const result = await useCase.execute(BASE_CMD);

    expect(saleRepo.emit).toHaveBeenCalledWith(BASE_CMD.saleTypeId, expect.any(Function));
    expect(result).toBeDefined();
  });

  it('does not insert stock movements when no warehouseId', async () => {
    await useCase.execute(BASE_CMD);

    expect(stockWriter.insertMovements).not.toHaveBeenCalled();
  });

  it('inserts sale_out stock movements when warehouseId is provided', async () => {
    await useCase.execute({ ...BASE_CMD, warehouseId: WH_ID });

    expect(stockWriter.insertMovements).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId:    PROD_ID,
          warehouseId:  WH_ID,
          movementType: 'sale_out',
        }),
      ]),
    );
  });
});
