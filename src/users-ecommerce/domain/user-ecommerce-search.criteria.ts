import { PageRequest } from '../../shared/domain/pagination';

export type UserEcommerceSortField = 'email' | 'firstName' | 'lastName' | 'createdAt';
export type SortDirection = 'ASC' | 'DESC';

export class UserEcommerceSearchCriteria {
  private constructor(
    readonly email: string | null,
    readonly firstName: string | null,
    readonly lastName: string | null,
    readonly active: boolean | null,
    readonly sortBy: UserEcommerceSortField,
    readonly sortDirection: SortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    active?: boolean | null;
    sortBy?: UserEcommerceSortField;
    sortDirection?: SortDirection;
    page?: number;
    limit?: number;
  }): UserEcommerceSearchCriteria {
    return new UserEcommerceSearchCriteria(
      params.email?.trim() || null,
      params.firstName?.trim() || null,
      params.lastName?.trim() || null,
      params.active ?? null,
      params.sortBy ?? 'lastName',
      params.sortDirection ?? 'ASC',
      PageRequest.of(params.page, params.limit),
    );
  }
}
