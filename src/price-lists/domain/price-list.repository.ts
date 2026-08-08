import type { Page } from '../../shared/domain/pagination';
import type { PriceList, PriceListItemSnapshot } from './price-list';
import type { PriceListSearchCriteria } from './price-list-search.criteria';
import type { PriceListId } from './value-objects/price-list-id.value-object';
import type { PriceListName } from './value-objects/price-list-name.value-object';

export const PRICE_LIST_REPOSITORY = Symbol('PRICE_LIST_REPOSITORY');

export interface PriceListRepository {
  /** Busca por id y carga los items. */
  findById(id: PriceListId): Promise<PriceList | null>;
  findByName(name: PriceListName, excludeId?: PriceListId): Promise<PriceList | null>;
  /** Lista de listas sin items (para seleccion). */
  search(criteria: PriceListSearchCriteria): Promise<Page<PriceList>>;
  insert(priceList: PriceList): Promise<void>;
  /** Actualiza solo los campos de la lista (nombre, descripcion, activo). */
  updateMeta(priceList: PriceList): Promise<void>;
  /** Reemplaza todos los items de la lista (DELETE + INSERT). */
  replaceItems(id: PriceListId, items: readonly PriceListItemSnapshot[]): Promise<void>;
}
