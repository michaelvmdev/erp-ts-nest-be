/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos: los casos de
 * uso no dependen de las clases de request HTTP.
 */

export interface CreateCategoryCommand {
  readonly categoryDescription: string;
  readonly categoryActive?: boolean;
}

export interface UpdateCategoryCommand {
  readonly categoryDescription?: string;
  readonly categoryActive?: boolean;
}

export interface ListCategoriesQuery {
  readonly categoryDescription?: string | null;
  readonly categoryActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
