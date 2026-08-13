import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { UserEcommerce } from '../domain/user-ecommerce';
import { UserEcommerceSearchCriteria } from '../domain/user-ecommerce-search.criteria';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository } from '../domain/user-ecommerce.repository';
import { ListUsersEcommerceQuery } from './user-ecommerce.commands';

@Injectable()
export class ListUsersEcommerceUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly users: UserEcommerceRepository,
  ) {}

  async execute(query: ListUsersEcommerceQuery): Promise<Page<UserEcommerce>> {
    const criteria = UserEcommerceSearchCriteria.of({
      email: query.email,
      firstName: query.firstName,
      lastName: query.lastName,
      active: query.active ?? null,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return this.users.search(criteria);
  }
}
