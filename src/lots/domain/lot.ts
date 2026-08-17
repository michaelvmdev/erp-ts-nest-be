import { InvalidLotError } from './lot.errors';
import { LotId } from './value-objects/lot-id.value-object';

export type LotStatus = 'active' | 'depleted' | 'expired';

export interface LotSnapshot {
  readonly id: string;
  readonly lotNumber: string;
  readonly productId: string;
  readonly warehouseId: string;
  readonly manufacturingDate: string | null;
  readonly expirationDate: string;
  readonly initialQuantity: number;
  readonly currentQuantity: number;
  readonly status: LotStatus;
  readonly notes: string | null;
  readonly createdAt: Date;
}

export class Lot {
  private constructor(
    private readonly _id: LotId,
    private readonly _lotNumber: string,
    private readonly _productId: string,
    private readonly _warehouseId: string,
    private readonly _manufacturingDate: string | null,
    private readonly _expirationDate: string,
    private readonly _initialQuantity: number,
    private _currentQuantity: number,
    private _status: LotStatus,
    private readonly _notes: string | null,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: LotId;
    lotNumber: string;
    productId: string;
    warehouseId: string;
    manufacturingDate?: string | null;
    expirationDate: string;
    initialQuantity: number;
    notes?: string | null;
  }): Lot {
    if (!params.lotNumber.trim()) {
      throw new InvalidLotError('El número de lote no puede estar vacío.');
    }
    Lot.validarFecha(params.expirationDate, 'expirationDate');
    if (params.manufacturingDate) {
      Lot.validarFecha(params.manufacturingDate, 'manufacturingDate');
      if (params.manufacturingDate >= params.expirationDate) {
        throw new InvalidLotError('La fecha de fabricación debe ser anterior a la de vencimiento.');
      }
    }
    if (!Number.isInteger(params.initialQuantity) || params.initialQuantity < 1) {
      throw new InvalidLotError('La cantidad inicial debe ser un entero mayor a 0.');
    }
    return new Lot(
      params.id,
      params.lotNumber.trim(),
      params.productId,
      params.warehouseId,
      params.manufacturingDate ?? null,
      params.expirationDate,
      params.initialQuantity,
      params.initialQuantity,
      'active',
      params.notes?.trim() ?? null,
      new Date(),
    );
  }

  static rehydrate(params: {
    id: LotId;
    lotNumber: string;
    productId: string;
    warehouseId: string;
    manufacturingDate: string | null;
    expirationDate: string;
    initialQuantity: number;
    currentQuantity: number;
    status: LotStatus;
    notes: string | null;
    createdAt: Date;
  }): Lot {
    return new Lot(
      params.id, params.lotNumber, params.productId, params.warehouseId,
      params.manufacturingDate, params.expirationDate,
      params.initialQuantity, params.currentQuantity,
      params.status, params.notes, params.createdAt,
    );
  }

  private static validarFecha(fecha: string, campo: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new InvalidLotError(`${campo} debe tener formato YYYY-MM-DD, se recibio "${fecha}".`);
    }
    const [a, m, d] = fecha.split('-').map(Number);
    const v = new Date(Date.UTC(a, m - 1, d));
    if (v.getUTCFullYear() !== a || v.getUTCMonth() !== m - 1 || v.getUTCDate() !== d) {
      throw new InvalidLotError(`La fecha ${fecha} no existe en el calendario.`);
    }
  }

  get id(): LotId              { return this._id; }
  get lotNumber(): string      { return this._lotNumber; }
  get productId(): string      { return this._productId; }
  get warehouseId(): string    { return this._warehouseId; }
  get manufacturingDate(): string | null { return this._manufacturingDate; }
  get expirationDate(): string { return this._expirationDate; }
  get initialQuantity(): number { return this._initialQuantity; }
  get currentQuantity(): number { return this._currentQuantity; }
  get status(): LotStatus      { return this._status; }
  get notes(): string | null   { return this._notes; }
  get createdAt(): Date        { return this._createdAt; }

  get isExpired(): boolean {
    return this._expirationDate < new Date().toISOString().slice(0, 10);
  }

  toSnapshot(): LotSnapshot {
    return {
      id: this._id.value,
      lotNumber: this._lotNumber,
      productId: this._productId,
      warehouseId: this._warehouseId,
      manufacturingDate: this._manufacturingDate,
      expirationDate: this._expirationDate,
      initialQuantity: this._initialQuantity,
      currentQuantity: this._currentQuantity,
      status: this._status,
      notes: this._notes,
      createdAt: this._createdAt,
    };
  }
}
