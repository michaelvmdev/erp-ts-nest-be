import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { Sale } from '../domain/sale';
import {
  InactiveClientError,
  SaleClientNotFoundError,
  SaleDistrictNotFoundError,
  SaleTypeNotFoundError,
} from '../domain/sale.errors';
import { SALE_CATALOG, SALE_REPOSITORY } from '../domain/sale.repository';
import type { SaleCatalog, SaleRepository } from '../domain/sale.repository';
import { SaleId } from '../domain/value-objects/sale-identifiers.value-object';
import { Ubigeo } from '../domain/value-objects/ubigeo.value-object';
import { construirLineas } from './sale-lines.builder';
import { CreateSaleCommand } from './sale.commands';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly sales: SaleRepository,
    @Inject(SALE_CATALOG)
    private readonly catalogo: SaleCatalog,
  ) {}

  async execute(command: CreateSaleCommand): Promise<Sale> {
    // El tipo de comprobante define el codigo del numero, asi que se resuelve
    // primero: sin el no hay serie de la que sacar correlativo.
    const codigo = await this.catalogo.saleTypeCodeOf(command.saleTypeId);
    if (!codigo) {
      throw new SaleTypeNotFoundError(command.saleTypeId);
    }

    const clientId = ClientId.of(command.clientId);
    const cliente = await this.catalogo.clientState(clientId.value);
    if (!cliente) {
      throw new SaleClientNotFoundError(clientId.value);
    }
    if (!cliente.active) {
      throw new InactiveClientError(clientId.value);
    }

    // Provincia y departamento salen del prefijo del distrito, no del cliente.
    const ubigeo = Ubigeo.ofDistrict(command.districtId);
    if (!(await this.catalogo.districtExists(ubigeo.districtId))) {
      throw new SaleDistrictNotFoundError(ubigeo.districtId);
    }

    const lineas = await construirLineas(this.catalogo, command.saleDetails);

    const { fecha, hora } = momentoDeEmision(command);

    // El numero se reserva y la venta se guarda en la misma transaccion: el
    // repositorio invoca esta funcion con el correlativo ya tomado. Ver el
    // comentario de `emit` en el puerto.
    return this.sales.emit(command.saleTypeId, (numero) =>
      Sale.create({
        id: SaleId.of(randomUUID()),
        number: numero,
        date: fecha,
        hour: hora,
        clientId,
        ubigeo,
        lines: lineas,
      }),
    );
  }
}

/**
 * Fecha y hora de la venta.
 *
 * Si no vienen en el cuerpo se toma el momento actual, que es el caso normal al
 * emitir. Se permite enviarlas para poder cargar ventas historicas, que es como
 * se generaron los datos de prueba.
 */
function momentoDeEmision(command: CreateSaleCommand): {
  fecha: string;
  hora: string;
} {
  const ahora = new Date();
  const dd = (n: number) => String(n).padStart(2, '0');

  // Se usa la hora local del servidor y no UTC: la fecha de un comprobante es la
  // del lugar donde se emite, y con UTC una venta de las 20:00 en Lima quedaria
  // fechada al dia siguiente.
  const fecha =
    command.saleDate ??
    `${ahora.getFullYear()}-${dd(ahora.getMonth() + 1)}-${dd(ahora.getDate())}`;
  const hora =
    command.saleHour ??
    `${dd(ahora.getHours())}:${dd(ahora.getMinutes())}:${dd(ahora.getSeconds())}`;

  return { fecha, hora };
}
