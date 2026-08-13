import { Test } from '@nestjs/testing';
import { STOCK_REPOSITORY } from '../domain/stock.repository';
import { GetStockAlertsUseCase } from './get-stock-alerts.use-case';

describe('GetStockAlertsUseCase', () => {
  let useCase: GetStockAlertsUseCase;
  let stockRepo: { findLowStock: jest.Mock };

  beforeEach(async () => {
    stockRepo = { findLowStock: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GetStockAlertsUseCase,
        { provide: STOCK_REPOSITORY, useValue: stockRepo },
      ],
    }).compile();

    useCase = module.get(GetStockAlertsUseCase);
  });

  it('returns stock alerts from repository', async () => {
    const alerts = [
      { productId: '1', productName: 'Widget', currentStock: 2, minimumStock: 10, deficit: 8 },
    ];
    stockRepo.findLowStock.mockResolvedValue(alerts);

    const result = await useCase.execute();

    expect(result).toBe(alerts);
    expect(stockRepo.findLowStock).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when all stock is above minimum', async () => {
    stockRepo.findLowStock.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
