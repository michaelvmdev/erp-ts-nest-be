export interface CreateUnitCommand {
  readonly unitCode: string;
  readonly unitDescription: string;
  readonly unitActive?: boolean;
}

export interface UpdateUnitCommand {
  readonly unitDescription?: string;
  readonly unitActive?: boolean;
}

export interface ListUnitsQuery {
  readonly unitCode?: string | null;
  readonly unitDescription?: string | null;
  readonly unitActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
