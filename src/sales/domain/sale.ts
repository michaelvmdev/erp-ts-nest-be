import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { SaleLine, SaleLineSnapshot } from './sale-line';
import {
  SaleId,
  SaleNumber,
} from './value-objects/sale-identifiers.value-object';
import { Ubigeo } from './value-objects/ubigeo.value-object';

export class InvalidSaleError extends InvalidInputError {
  readonly code = 'INVALID_SALE';

  constructor(message: string) {
    super(message);
  }
}

export interface SaleSnapshot {
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
  readonly lines: readonly SaleLineSnapshot[];
}

/**
 * Raiz del agregado Venta.
 *
 * La venta y sus lineas son un unico limite de consistencia: no existe una venta
 * sin lineas ni un total que no sea la suma de ellas. Por eso las lineas se
 * pasan al construir y no se agregan de a una desde fuera; reemplazarlas recalcula
 * los importes en el mismo paso.
 *
 * Los importes NO se reciben nunca. Se derivan de las lineas, que a su vez toman
 * el precio del catalogo. Aceptar un total del cliente permitiria facturar un
 * televisor en un sol, y el esquema ademas exige que total sea exactamente
 * sub_total + igv y que cada parcial sea cantidad por precio.
 *
 * `number`, `date` y `hour` son inmutables: identifican el documento fiscal y el
 * momento de su emision. Corregirlos no es una edicion, es emitir otro documento.
 */
export class Sale {
  /** IGV peruano. */
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private _lines: SaleLine[];

  private constructor(
    private readonly _id: SaleId,
    private readonly _number: SaleNumber,
    private readonly _date: string,
    private readonly _hour: string,
    private _clientId: ClientId,
    private _ubigeo: Ubigeo,
    lines: SaleLine[],
  ) {
    this._lines = lines;
  }

  static create(params: {
    id: SaleId;
    number: SaleNumber;
    date: string;
    hour: string;
    clientId: ClientId;
    ubigeo: Ubigeo;
    lines: SaleLine[];
  }): Sale {
    Sale.validarFecha(params.date);
    Sale.validarHora(params.hour);
    Sale.validarLineas(params.lines);
    return new Sale(
      params.id,
      params.number,
      params.date,
      params.hour,
      params.clientId,
      params.ubigeo,
      [...params.lines],
    );
  }

  static rehydrate(params: {
    id: SaleId;
    number: SaleNumber;
    date: string;
    hour: string;
    clientId: ClientId;
    ubigeo: Ubigeo;
    lines: SaleLine[];
  }): Sale {
    return new Sale(
      params.id,
      params.number,
      params.date,
      params.hour,
      params.clientId,
      params.ubigeo,
      [...params.lines],
    );
  }

  private static validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidSaleError(
        `La fecha debe tener el formato YYYY-MM-DD, se recibio "${fecha}".`,
      );
    }
    // Se compara la cadena y no un Date para evitar que el desfase de zona
    // horaria del servidor adelante o atrase el dia.
    const [a, m, d] = fecha.split('-').map(Number);
    const valida = new Date(Date.UTC(a, m - 1, d));
    if (
      valida.getUTCFullYear() !== a ||
      valida.getUTCMonth() !== m - 1 ||
      valida.getUTCDate() !== d
    ) {
      throw new InvalidSaleError(
        `La fecha ${fecha} no existe en el calendario.`,
      );
    }
  }

  private static validarHora(hora: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)) {
      throw new InvalidSaleError(
        `La hora debe tener el formato HH:MM:SS, se recibio "${hora}".`,
      );
    }
  }

  private static validarLineas(lines: SaleLine[]): void {
    if (lines.length === 0) {
      throw new InvalidSaleError(
        'Una venta necesita al menos una linea de detalle.',
      );
    }
    if (lines.length > Sale.MAX_LINES) {
      throw new InvalidSaleError(
        `Una venta no puede tener mas de ${Sale.MAX_LINES} lineas, se recibieron ${lines.length}.`,
      );
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidSaleError(
        'Un producto no puede repetirse en dos lineas de la misma venta: sumá las cantidades.',
      );
    }
  }

  get id(): SaleId {
    return this._id;
  }

  get number(): SaleNumber {
    return this._number;
  }

  get date(): string {
    return this._date;
  }

  get hour(): string {
    return this._hour;
  }

  get clientId(): ClientId {
    return this._clientId;
  }

  get ubigeo(): Ubigeo {
    return this._ubigeo;
  }

  get lines(): readonly SaleLine[] {
    return this._lines;
  }

  get subTotal(): Money {
    return Money.fromCentimos(
      this._lines.reduce((acc, l) => acc + l.partial.centimos, 0),
    );
  }

  get igv(): Money {
    // Se redondea al centimo sobre el subtotal completo, no linea por linea:
    // sumar redondeos parciales desviaria el total unos centimos.
    return Money.fromCentimos(
      Math.round(this.subTotal.centimos * Sale.IGV_RATE),
    );
  }

  get total(): Money {
    // Suma exacta de los dos, que es lo que exige el CHECK del esquema.
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  reassignClient(clientId: ClientId): void {
    this._clientId = clientId;
  }

  relocate(ubigeo: Ubigeo): void {
    this._ubigeo = ubigeo;
  }

  /**
   * Reemplaza todas las lineas de una vez.
   *
   * No hay `agregarLinea` ni `quitarLinea` a proposito: los importes de la venta
   * dependen del conjunto completo, y una API que permita dejarlo a medias
   * invita a guardar un total que no cuadra. Al reemplazar, los totales se
   * recalculan solos porque son propiedades derivadas.
   */
  replaceLines(lines: SaleLine[]): void {
    Sale.validarLineas(lines);
    this._lines = [...lines];
  }

  toSnapshot(): SaleSnapshot {
    return {
      id: this._id.value,
      number: this._number.value,
      saleTypeCode: this._number.code,
      date: this._date,
      hour: this._hour,
      clientId: this._clientId.value,
      departmentId: this._ubigeo.departmentId,
      provinceId: this._ubigeo.provinceId,
      districtId: this._ubigeo.districtId,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      lines: this._lines.map((l) => l.toSnapshot()),
    };
  }
}
