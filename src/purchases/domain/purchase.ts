import { InvalidInputError } from '../../shared/domain/domain.error';
import { Money } from '../../shared/domain/money.value-object';
import { SupplierId } from '../../suppliers/domain/value-objects/supplier-id.value-object';
import { PurchaseLine, PurchaseLineSnapshot } from './purchase-line';
import { PurchaseId } from './value-objects/purchase-id.value-object';

export class InvalidPurchaseError extends InvalidInputError {
  readonly code = 'INVALID_PURCHASE';

  constructor(message: string) {
    super(message);
  }
}

export interface PurchaseSnapshot {
  readonly id: string;
  readonly supplierId: string;
  readonly date: string;
  readonly hour: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lines: readonly PurchaseLineSnapshot[];
}

/**
 * Raiz del agregado Compra.
 *
 * Espejo de Venta pero en sentido inverso —la tienda le compra a un proveedor
 * en vez de venderle a un cliente— y mas simple: no lleva numero de comprobante
 * ni correlativo, porque una compra no es un documento fiscal que esta API
 * emita.
 *
 * La compra y sus lineas son un unico limite de consistencia: no existe una
 * compra sin lineas ni un total que no sea la suma de ellas. Por eso las lineas
 * se pasan al construir y no se agregan de a una desde fuera.
 *
 * Los importes NO se reciben: se derivan de las lineas. Cada linea si trae su
 * costo unitario (que no esta en el catalogo), pero el parcial, el subtotal, el
 * IGV y el total los calcula el backend, igual que el esquema exige que total
 * sea exactamente sub_total + igv y que cada parcial sea cantidad por costo.
 */
export class Purchase {
  /** IGV peruano. */
  static readonly IGV_RATE = 0.18;
  static readonly MAX_LINES = 100;

  private constructor(
    private readonly _id: PurchaseId,
    private _supplierId: SupplierId,
    private _date: string,
    private _hour: string,
    private _lines: PurchaseLine[],
  ) {}

  static create(params: {
    id: PurchaseId;
    supplierId: SupplierId;
    date: string;
    hour: string;
    lines: PurchaseLine[];
  }): Purchase {
    Purchase.validarFecha(params.date);
    Purchase.validarHora(params.hour);
    Purchase.validarLineas(params.lines);
    return new Purchase(
      params.id,
      params.supplierId,
      params.date,
      params.hour,
      [...params.lines],
    );
  }

  static rehydrate(params: {
    id: PurchaseId;
    supplierId: SupplierId;
    date: string;
    hour: string;
    lines: PurchaseLine[];
  }): Purchase {
    return new Purchase(
      params.id,
      params.supplierId,
      params.date,
      params.hour,
      [...params.lines],
    );
  }

  private static validarFecha(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidPurchaseError(
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
      throw new InvalidPurchaseError(
        `La fecha ${fecha} no existe en el calendario.`,
      );
    }
  }

  private static validarHora(hora: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)) {
      throw new InvalidPurchaseError(
        `La hora debe tener el formato HH:MM:SS, se recibio "${hora}".`,
      );
    }
  }

  private static validarLineas(lines: PurchaseLine[]): void {
    if (lines.length === 0) {
      throw new InvalidPurchaseError(
        'Una compra necesita al menos una linea de detalle.',
      );
    }
    if (lines.length > Purchase.MAX_LINES) {
      throw new InvalidPurchaseError(
        `Una compra no puede tener mas de ${Purchase.MAX_LINES} lineas, se recibieron ${lines.length}.`,
      );
    }
    const productos = new Set(lines.map((l) => l.productId.value));
    if (productos.size !== lines.length) {
      throw new InvalidPurchaseError(
        'Un producto no puede repetirse en dos lineas de la misma compra: suma las cantidades.',
      );
    }
  }

  get id(): PurchaseId {
    return this._id;
  }

  get supplierId(): SupplierId {
    return this._supplierId;
  }

  get date(): string {
    return this._date;
  }

  get hour(): string {
    return this._hour;
  }

  get lines(): readonly PurchaseLine[] {
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
      Math.round(this.subTotal.centimos * Purchase.IGV_RATE),
    );
  }

  get total(): Money {
    return Money.fromCentimos(this.subTotal.centimos + this.igv.centimos);
  }

  reassignSupplier(supplierId: SupplierId): void {
    this._supplierId = supplierId;
  }

  changeDate(date: string): void {
    Purchase.validarFecha(date);
    this._date = date;
  }

  changeHour(hour: string): void {
    Purchase.validarHora(hour);
    this._hour = hour;
  }

  /**
   * Reemplaza todas las lineas de una vez.
   *
   * No hay `agregarLinea` ni `quitarLinea` a proposito: los importes de la
   * compra dependen del conjunto completo, y al reemplazar se recalculan solos
   * porque son propiedades derivadas.
   */
  replaceLines(lines: PurchaseLine[]): void {
    Purchase.validarLineas(lines);
    this._lines = [...lines];
  }

  toSnapshot(): PurchaseSnapshot {
    return {
      id: this._id.value,
      supplierId: this._supplierId.value,
      date: this._date,
      hour: this._hour,
      subTotal: this.subTotal,
      igv: this.igv,
      total: this.total,
      lines: this._lines.map((l) => l.toSnapshot()),
    };
  }
}
