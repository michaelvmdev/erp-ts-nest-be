export interface CreateWarehouseCommand {
  readonly warehouseCode: string;
  readonly warehouseDescription: string;
  readonly warehouseActive?: boolean;
}

export interface UpdateWarehouseCommand {
  readonly warehouseDescription?: string;
  readonly warehouseActive?: boolean;
}

export interface ListWarehousesQuery {
  readonly warehouseCode?: string | null;
  readonly warehouseDescription?: string | null;
  readonly warehouseActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
