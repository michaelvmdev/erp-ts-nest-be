import { SaleType } from './sale-type';

/**
 * Puerto de salida del agregado Tipo de comprobante.
 *
 * Una sola operacion y sin paginado: el catalogo tiene dos filas y no esta
 * pensado para pasar de un punado (nota de credito, nota de debito). Devolver la
 * lista completa es lo que necesita el cliente para poblar un desplegable.
 */
export interface SaleTypeRepository {
  findAll(): Promise<SaleType[]>;
}

export const SALE_TYPE_REPOSITORY = Symbol('SaleTypeRepository');
