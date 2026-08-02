/**
 * Contratos de entrada de la capa de aplicacion.
 *
 * Son tipos planos a proposito: el caso de uso no debe depender de las clases
 * de request HTTP, porque entonces no se podria invocar desde una cola, un cron
 * o un test sin fabricar objetos del transporte.
 *
 * `undefined` significa "no se envio" y por eso en UpdateProductCommand se
 * distingue de `null`, que significa "borrar el valor". Es la diferencia entre
 * un PATCH que no toca la descripcion y uno que la deja vacia.
 */

export interface CreateProductCommand {
  readonly brandId: string;
  readonly categoryId: string;
  readonly productName: string;
  readonly productDescription?: string | null;
  readonly productImage?: string | null;
  readonly productUnitPrice: number;
  readonly productActive?: boolean;
}

export interface UpdateProductCommand {
  readonly brandId?: string;
  readonly categoryId?: string;
  readonly productName?: string;
  readonly productDescription?: string | null;
  readonly productImage?: string | null;
  readonly productUnitPrice?: number;
  readonly productActive?: boolean;
}

export interface SearchProductsQuery {
  readonly productDescription?: string | null;
  readonly productUnitPrice?: {
    readonly min?: number | null;
    readonly max?: number | null;
  } | null;
  readonly brandId?: string | null;
  readonly productActive?: boolean | null;
  readonly sortBy?: 'name' | 'unitPrice';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
