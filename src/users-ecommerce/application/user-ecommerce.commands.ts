export interface CreateUserEcommerceCommand {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string | null;
  readonly active?: boolean;
}

export interface UpdateUserEcommerceCommand {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string | null;
  readonly active?: boolean;
}

export interface ListUsersEcommerceQuery {
  readonly email?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly active?: boolean | null;
  readonly sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
