import { Inject, Injectable } from '@nestjs/common';
import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { Sale } from '../domain/sale';
import {
  InactiveClientError,
  SaleClientNotFoundError,
  SaleDistrictNotFoundError,
  SaleNotFoundError,
} from '../domain/sale.errors';
import { SALE_CATALOG, SALE_REPOSITORY } from '../domain/sale.repository';
import type { SaleCatalog, SaleRepository } from '../domain/sale.repository';
import { SaleId } from '../domain/value-objects/sale-identifiers.value-object';
import { Ubigeo } from '../domain/value-objects/ubigeo.value-object';
import { construirLineas } from './sale-lines.builder';
import { UpdateSaleCommand } from './sale.commands';

/**
 * Corrige una venta ya emitida.
 *
 * Lo que se puede corregir es acotado a proposito: el cliente, el ubigeo y las
 * lineas. El numero de comprobante, la fecha y la hora NO se tocan, porque son la
 * identidad fiscal del documento y el momento de su emision. Cambiarlos no seria
 * corregir una venta sino inventar otra.
 *
 * Los importes tampoco se reciben: si cambian las lineas, se recalculan.
 */
@Injectable()
export class UpdateSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly sales: SaleRepository,
    @Inject(SALE_CATALOG)
    private readonly catalogo: SaleCatalog,
  ) {}

  async execute(rawSaleId: string, command: UpdateSaleCommand): Promise<Sale> {
    const id = SaleId.of(rawSaleId);

    const sale = await this.sales.findById(id);
    if (!sale) {
      throw new SaleNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, de modo que solo se aplica
    // lo que vino en el cuerpo.
    if (command.clientId !== undefined) {
      const clientId = ClientId.of(command.clientId);
      const cliente = await this.catalogo.clientState(clientId.value);
      if (!cliente) {
        throw new SaleClientNotFoundError(clientId.value);
      }
      if (!cliente.active) {
        throw new InactiveClientError(clientId.value);
      }
      sale.reassignClient(clientId);
    }

    if (command.districtId !== undefined) {
      const ubigeo = Ubigeo.ofDistrict(command.districtId);
      if (!(await this.catalogo.districtExists(ubigeo.districtId))) {
        throw new SaleDistrictNotFoundError(ubigeo.districtId);
      }
      sale.relocate(ubigeo);
    }

    if (command.saleDetails !== undefined) {
      // Reemplazo completo, no parcial: los importes dependen del conjunto de
      // lineas, y aplicar cambios de a una dejaria totales incoherentes a mitad
      // de camino. Al reemplazarlas, el agregado recalcula subtotal, IGV y total.
      sale.replaceLines(
        await construirLineas(this.catalogo, command.saleDetails),
      );
    }

    await this.sales.update(sale);
    return sale;
  }
}
