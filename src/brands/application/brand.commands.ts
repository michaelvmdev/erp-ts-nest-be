/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos: los casos de
 * uso no dependen de las clases de request HTTP.
 */

export interface CreateBrandCommand {
  readonly brandDescription: string;
  readonly brandActive?: boolean;
}

export interface UpdateBrandCommand {
  readonly brandDescription?: string;
  readonly brandActive?: boolean;
}

export interface ListBrandsQuery {
  readonly brandDescription?: string | null;
  readonly brandActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
