import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { Sale } from './sale';
import { SaleSearchCriteria } from './sale-search.criteria';
import {
  SaleId,
  SaleNumber,
} from './value-objects/sale-identifiers.value-object';

/**
 * Cabecera de venta sin sus lineas, para los listados.
 *
 * El listado no devuelve el detalle a proposito: veinte ventas con cinco lineas
 * cada una son cien filas extra que el cliente casi nunca usa en una tabla. El
 * detalle completo se obtiene con GET /sales/{saleId}.
 *
 * Es un modelo de lectura, no el agregado: un Sale sin lineas violaria su propia
 * invariante de que el total es la suma de ellas, asi que no se puede reutilizar.
 */
export interface SaleSummary {
  readonly id: string;
  readonly number: string;
  readonly saleTypeCode: string;
  readonly date: string;
  readonly hour: string;
  readonly clientId: string;
  readonly departmentId: string;
  readonly provinceId: string;
  readonly districtId: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lineCount: number;
}

export interface SaleRepository {
  findById(id: SaleId): Promise<Sale | null>;

  search(criteria: SaleSearchCriteria): Promise<Page<SaleSummary>>;

  /**
   * Reserva el siguiente numero del tipo indicado y persiste la venta que
   * construya `armar`, todo en una sola transaccion.
   *
   * La firma es asi —recibiendo una funcion en vez de una venta ya hecha— por un
   * motivo concreto: el numero es la identidad fiscal del documento y no puede
   * faltar, pero solo se conoce despues de consumir el correlativo. Si el caso de
   * uso pidiera el numero y luego insertara en dos pasos, un fallo en el segundo
   * dejaria un numero quemado y un hueco en la serie. Aqui reservar y guardar son
   * la misma operacion atomica, y el agregado nunca existe sin numero.
   *
   * El incremento del correlativo debe ser atomico frente a dos ventas
   * simultaneas: dos peticiones a la vez no pueden obtener el mismo numero, que
   * chocaria contra el UNIQUE de sale_number.
   */
  emit(saleTypeId: number, armar: (numero: SaleNumber) => Sale): Promise<Sale>;

  /** Actualiza la cabecera y reemplaza por completo las lineas. */
  update(sale: Sale): Promise<void>;
}

/**
 * Lo que el modulo de ventas necesita saber de otros agregados.
 *
 * Va en un unico puerto porque es una sola pregunta: "los datos que esta venta
 * referencia, existen y estan disponibles". Partirlo en cuatro puertos con una
 * implementacion cada uno seria ceremonia sin ganancia.
 */
export interface SaleCatalog {
  /** Codigo de tres letras del tipo, o null si el tipo no existe. */
  saleTypeCodeOf(saleTypeId: number): Promise<string | null>;

  /** `null` si el cliente no existe; si existe, indica si esta activo. */
  clientState(clientId: string): Promise<{ active: boolean } | null>;

  districtExists(districtId: string): Promise<boolean>;

  /**
   * Precio y estado de cada producto pedido. Los que no existen simplemente no
   * aparecen en el mapa, para que el caso de uso pueda nombrarlos en el error.
   */
  productsState(
    productIds: readonly string[],
  ): Promise<Map<string, { price: Money; active: boolean }>>;
}

export const SALE_REPOSITORY = Symbol('SaleRepository');
export const SALE_CATALOG = Symbol('SaleCatalog');
