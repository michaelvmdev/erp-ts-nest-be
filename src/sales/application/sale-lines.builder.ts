import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { SaleLine } from '../domain/sale-line';
import {
  InactiveProductsError,
  SaleProductsNotFoundError,
} from '../domain/sale.errors';
import type { SaleCatalog } from '../domain/sale.repository';
import { SaleLineCommand } from './sale.commands';

/**
 * Convierte las lineas pedidas en lineas de dominio, poniendoles el precio
 * vigente del catalogo.
 *
 * Lo comparten el alta y la modificacion: en ambos casos hay que resolver los
 * mismos productos con las mismas reglas, y duplicarlo garantizaria que una de
 * las dos rutas se quedara sin alguna validacion.
 *
 * Los productos se consultan de una sola vez y no uno por uno: con veinte lineas
 * serian veinte viajes a la base para responder una pregunta que cabe en una
 * consulta.
 */
export async function construirLineas(
  catalogo: SaleCatalog,
  pedidas: readonly SaleLineCommand[],
): Promise<SaleLine[]> {
  // ProductId.of valida el formato, asi que un id mal escrito falla con 400
  // antes de consultar nada.
  const ids = pedidas.map((l) => ProductId.of(l.productId).value);

  const estado = await catalogo.productsState([...new Set(ids)]);

  const inexistentes = [...new Set(ids)].filter((id) => !estado.has(id));
  if (inexistentes.length > 0) {
    throw new SaleProductsNotFoundError(inexistentes);
  }

  const inactivos = [...new Set(ids)].filter((id) => !estado.get(id)?.active);
  if (inactivos.length > 0) {
    throw new InactiveProductsError(inactivos);
  }

  // El item es el correlativo de la linea dentro de la venta y empieza en 1, tal
  // como exige el CHECK del esquema.
  return pedidas.map((linea, indice) =>
    SaleLine.of({
      item: indice + 1,
      productId: ProductId.of(linea.productId),
      quantity: linea.quantity,
      unitPrice: estado.get(ProductId.of(linea.productId).value)!.price,
    }),
  );
}
