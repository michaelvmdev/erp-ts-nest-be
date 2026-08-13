import { Test } from '@nestjs/testing';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import { GetUserPurchaseHistoryUseCase } from './get-user-purchase-history.use-case';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

describe('GetUserPurchaseHistoryUseCase', () => {
  let useCase: GetUserPurchaseHistoryUseCase;
  let repo: { getPurchaseHistory: jest.Mock };

  beforeEach(async () => {
    repo = { getPurchaseHistory: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GetUserPurchaseHistoryUseCase,
        { provide: USER_ECOMMERCE_REPOSITORY, useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetUserPurchaseHistoryUseCase);
  });

  it('delegates to repository with the given id', async () => {
    const items = [
      {
        saleId: 'sale-1',
        saleDate: '2026-07-01',
        documentNumber: 'F001-001',
        total: 150,
        saleStatus: 'completed',
        npsScore: 9,
        npsCategory: 'promoter',
      },
    ];
    repo.getPurchaseHistory.mockResolvedValue(items);

    const result = await useCase.execute(USER_ID);

    expect(result).toBe(items);
    expect(repo.getPurchaseHistory).toHaveBeenCalledWith(USER_ID);
  });

  it('returns empty array when user has no purchases', async () => {
    repo.getPurchaseHistory.mockResolvedValue([]);

    const result = await useCase.execute(USER_ID);

    expect(result).toEqual([]);
  });
});
