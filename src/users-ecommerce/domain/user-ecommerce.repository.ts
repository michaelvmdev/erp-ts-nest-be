import { Page } from '../../shared/domain/pagination';
import { UserEcommerce } from './user-ecommerce';
import { UserEcommerceSearchCriteria } from './user-ecommerce-search.criteria';
import { UserEcommerceId } from './value-objects/user-ecommerce-id.value-object';

export interface UserPurchaseHistoryItem {
  readonly saleId: string;
  readonly saleDate: string;
  readonly serie: string;
  readonly number: string;
  readonly total: string;
  readonly saleStatus: string;
  readonly npsScore: number | null;
  readonly npsCategory: 'promoter' | 'passive' | 'detractor' | null;
}

export interface UserEcommerceRepository {
  findById(id: UserEcommerceId): Promise<UserEcommerce | null>;

  findByEmail(email: string, excludeId?: UserEcommerceId): Promise<UserEcommerce | null>;

  search(criteria: UserEcommerceSearchCriteria): Promise<Page<UserEcommerce>>;

  insert(user: UserEcommerce): Promise<void>;

  update(user: UserEcommerce): Promise<void>;

  delete(id: UserEcommerceId): Promise<void>;

  getPurchaseHistory(id: string): Promise<UserPurchaseHistoryItem[]>;
}

export const USER_ECOMMERCE_REPOSITORY = Symbol('UserEcommerceRepository');
