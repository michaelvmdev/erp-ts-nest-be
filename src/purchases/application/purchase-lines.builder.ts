import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { Money } from '../../shared/domain/money.value-object';
import { PurchaseLine } from '../domain/purchase-line';
import { PurchaseProductsNotFoundError } from '../domain/purchase.errors';
import type { PurchaseCatalog } from '../domain/purchase.repository';
import { PurchaseLineCommand } from './purchase.commands';

/**
 * Convierte las lineas pedidas en lineas de dominio.
 *
 * A diferencia del builder de ventas, el costo unitario no se toma del catalogo
 * sino de la propia peticion: en una compra el precio lo pone el proveedor, no
 * la tienda. Del catalogo solo se comprueba que el producto exista; su estado
 * activo no importa, porque un producto inactivo si se puede reabastecer.
 *
 * Los productos se consultan de una sola vez y no uno por uno: con veinte lineas
 * serian veinte viajes a la base para responder una pregunta que cabe en una
 * consulta.
 */
export async function construirLineas(
  catalogo: PurchaseCatalog,
  pedidas: readonly PurchaseLineCommand[],
): Promise<PurchaseLine[]> {
  // ProductId.of valida el formato y Money.fromNumber el costo, asi que un id o
  // un importe mal formado falla con 400 antes de consultar nada.
  const ids = pedidas.map((l) => ProductId.of(l.productId).value);

  const existentes = await catalogo.productsExist([...new Set(ids)]);

  const inexistentes = [...new Set(ids)].filter((id) => !existentes.has(id));
  if (inexistentes.length > 0) {
    throw new PurchaseProductsNotFoundError(inexistentes);
  }

  // El item es el correlativo de la linea dentro de la compra y empieza en 1,
  // tal como exige el CHECK del esquema.
  return pedidas.map((linea, indice) =>
    PurchaseLine.of({
      item: indice + 1,
      productId: ProductId.of(linea.productId),
      quantity: linea.quantity,
      unitPrice: Money.fromNumber(linea.unitPrice),
    }),
  );
}
