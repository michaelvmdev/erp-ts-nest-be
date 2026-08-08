export interface CreatePriceListCommand {
  readonly priceListName: string;
  readonly priceListDescription?: string | null;
  readonly priceListActive?: boolean;
}

export interface UpdatePriceListCommand {
  readonly priceListName?: string;
  readonly priceListDescription?: string | null;
  readonly priceListActive?: boolean;
}

export interface ListPriceListsQuery {
  readonly priceListName?: string | null;
  readonly priceListActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}

export interface PriceListItemInput {
  readonly productId: string;
  readonly unitPrice: number;
}

export interface SetPriceListItemsCommand {
  readonly priceListId: string;
  readonly items: readonly PriceListItemInput[];
}

export interface RemovePriceListItemCommand {
  readonly priceListId: string;
  readonly productId: string;
}
