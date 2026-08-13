import { Test } from '@nestjs/testing';
import { DASHBOARD_REPOSITORY } from '../domain/dashboard.repository';
import { GetProfitabilityUseCase } from './get-profitability.use-case';

describe('GetProfitabilityUseCase', () => {
  let useCase: GetProfitabilityUseCase;
  let dashboard: { profitability: jest.Mock };

  beforeEach(async () => {
    dashboard = { profitability: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GetProfitabilityUseCase,
        { provide: DASHBOARD_REPOSITORY, useValue: dashboard },
      ],
    }).compile();

    useCase = module.get(GetProfitabilityUseCase);
  });

  it('delegates to repository and returns rows', async () => {
    const rows = [{ productId: '1', productName: 'Widget', revenue: 100, cost: 60, margin: 40, marginPct: 40 }];
    dashboard.profitability.mockResolvedValue(rows);

    const result = await useCase.execute('2026-01-01', '2026-08-13');

    expect(result).toBe(rows);
    expect(dashboard.profitability).toHaveBeenCalledWith('2026-01-01', '2026-08-13');
  });

  it('passes undefined dates when not provided', async () => {
    dashboard.profitability.mockResolvedValue([]);

    await useCase.execute();

    expect(dashboard.profitability).toHaveBeenCalledWith(undefined, undefined);
  });
});
