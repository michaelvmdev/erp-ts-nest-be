import { PriceListItemNotFoundError } from './price-list.errors';
import { PriceListId } from './value-objects/price-list-id.value-object';
import { PriceListName } from './value-objects/price-list-name.value-object';

export interface PriceListItemSnapshot {
  readonly productId: string;
  readonly unitPrice: number;
}

export interface PriceListSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly active: boolean;
  readonly items: readonly PriceListItemSnapshot[];
}

export class PriceList {
  private constructor(
    private readonly _id: PriceListId,
    private _name: PriceListName,
    private _description: string | null,
    private _active: boolean,
    private _items: PriceListItemSnapshot[],
  ) {}

  static create(params: {
    id: PriceListId;
    name: PriceListName;
    description?: string | null;
    active?: boolean;
  }): PriceList {
    return new PriceList(
      params.id,
      params.name,
      params.description ?? null,
      params.active ?? true,
      [],
    );
  }

  static rehydrate(params: {
    id: PriceListId;
    name: PriceListName;
    description: string | null;
    active: boolean;
    items: PriceListItemSnapshot[];
  }): PriceList {
    return new PriceList(params.id, params.name, params.description, params.active, params.items);
  }

  get id(): PriceListId {
    return this._id;
  }

  get name(): PriceListName {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get isActive(): boolean {
    return this._active;
  }

  get items(): readonly PriceListItemSnapshot[] {
    return this._items;
  }

  rename(name: PriceListName): void {
    this._name = name;
  }

  changeDescription(description: string | null): void {
    this._description = description;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  /** Reemplaza todos los items de la lista. */
  setItems(items: PriceListItemSnapshot[]): void {
    this._items = [...items];
  }

  /** Elimina un item por productId. Lanza si no existe. */
  removeItem(productId: string): void {
    const idx = this._items.findIndex((i) => i.productId === productId);
    if (idx < 0) {
      throw new PriceListItemNotFoundError(productId);
    }
    this._items = this._items.filter((_, i) => i !== idx);
  }

  toSnapshot(): PriceListSnapshot {
    return {
      id: this._id.value,
      name: this._name.value,
      description: this._description,
      active: this._active,
      items: [...this._items],
    };
  }
}
