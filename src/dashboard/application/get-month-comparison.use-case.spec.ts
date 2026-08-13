import { Test } from '@nestjs/testing';
import { DASHBOARD_REPOSITORY } from '../domain/dashboard.repository';
import { GetMonthComparisonUseCase } from './get-month-comparison.use-case';

describe('GetMonthComparisonUseCase', () => {
  let useCase: GetMonthComparisonUseCase;
  let dashboard: { monthComparison: jest.Mock };

  beforeEach(async () => {
    dashboard = { monthComparison: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GetMonthComparisonUseCase,
        { provide: DASHBOARD_REPOSITORY, useValue: dashboard },
      ],
    }).compile();

    useCase = module.get(GetMonthComparisonUseCase);
  });

  it('delegates year and month to repository', async () => {
    const comparison = {
      year: 2026, month: 8,
      currentAmount: 5000, currentCount: 20,
      prevMonthAmount: 4000, prevMonthCount: 18, prevMonthAmountPct: 25, prevMonthCountPct: 11,
      prevYearAmount: 3000, prevYearCount: 15, prevYearAmountPct: 67, prevYearCountPct: 33,
    };
    dashboard.monthComparison.mockResolvedValue(comparison);

    const result = await useCase.execute(2026, 8);

    expect(result).toBe(comparison);
    expect(dashboard.monthComparison).toHaveBeenCalledWith(2026, 8);
  });
});
