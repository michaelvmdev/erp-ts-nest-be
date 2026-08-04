import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ClientOrmEntity } from '../../../clients/infrastructure/persistence/client.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { Money } from '../../../shared/domain/money.value-object';
import { Page } from '../../../shared/domain/pagination';
import { Sale } from '../../domain/sale';
import { SaleSearchCriteria } from '../../domain/sale-search.criteria';
import {
  SaleSeriesExhaustedError,
  SaleTypeNotFoundError,
} from '../../domain/sale.errors';
import type {
  SaleCatalog,
  SaleRepository,
  SaleSummary,
} from '../../domain/sale.repository';
import {
  SaleId,
  SaleNumber,
} from '../../domain/value-objects/sale-identifiers.value-object';
import { SaleMapper } from './sale.mapper';
import { SaleDetailOrmEntity, SaleOrmEntity } from './sale.orm-entity';

/**
 * Extrae las filas de un `UPDATE ... RETURNING`.
 *
 * TypeORM no devuelve la misma forma para todas las sentencias: un SELECT da
 * `[fila, fila]`, pero un UPDATE con RETURNING da `[[fila, fila], cantidad]`.
 * Leer `resultado[0]` sin distinguirlo devuelve el arreglo entero en vez de la
 * primera fila, y el error aparece recien al acceder a una columna.
 */
function filasDeUpdate<T>(resultado: unknown): T[] {
  if (!Array.isArray(resultado)) return [];
  return (Array.isArray(resultado[0]) ? resultado[0] : resultado) as T[];
}

@Injectable()
export class TypeOrmSaleRepository implements SaleRepository, SaleCatalog {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(SaleOrmEntity)
    private readonly sales: Repository<SaleOrmEntity>,
    @InjectRepository(SaleDetailOrmEntity)
    private readonly detalles: Repository<SaleDetailOrmEntity>,
    @InjectRepository(ClientOrmEntity)
    private readonly clients: Repository<ClientOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: SaleId): Promise<Sale | null> {
    const row = await this.sales.findOne({ where: { saleId: id.value } });
    if (!row) return null;
    const detalles = await this.detalles.find({ where: { saleId: id.value } });
    return SaleMapper.toDomain(row, detalles);
  }

  async search(criteria: SaleSearchCriteria): Promise<Page<SaleSummary>> {
    const qb = this.sales.createQueryBuilder('s');
    this.aplicarFiltros(qb, criteria);

    const columna =
      criteria.sortBy === 'total'
        ? 's.total'
        : criteria.sortBy === 'number'
          ? 's.saleNumber'
          : 's.saleDate';

    qb.orderBy(columna, criteria.sortDirection)
      // Desempate por clave primaria: sin esto, las ventas del mismo dia pueden
      // alternar de pagina entre consultas y el paginado repite o saltea filas.
      .addOrderBy('s.saleId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    // El conteo de lineas se resuelve en una sola consulta para las ventas de
    // esta pagina, no una por venta.
    const conteos = await this.contarLineas(rows.map((r) => r.saleId));

    return new Page(
      rows.map((row) =>
        SaleMapper.toSummary(
          Object.assign(row, {
            lineCount: String(conteos.get(row.saleId) ?? 0),
          }),
        ),
      ),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  private async contarLineas(saleIds: string[]): Promise<Map<string, number>> {
    if (saleIds.length === 0) return new Map();
    const filas = await this.detalles
      .createQueryBuilder('d')
      .select('d.saleId', 'saleId')
      .addSelect('count(*)', 'n')
      .where('d.saleId IN (:...ids)', { ids: saleIds })
      .groupBy('d.saleId')
      .getRawMany<{ saleId: string; n: string }>();
    return new Map(filas.map((f) => [f.saleId, Number(f.n)]));
  }

  private aplicarFiltros(
    qb: SelectQueryBuilder<SaleOrmEntity>,
    criteria: SaleSearchCriteria,
  ): void {
    if (criteria.saleNumber) {
      qb.andWhere('s.saleNumber = :numero', { numero: criteria.saleNumber });
    }

    if (criteria.saleTypeCode) {
      // Prefijo y no substring: un LIKE anclado al inicio puede aprovechar el
      // indice de sale_number, mientras que '%FAC%' obligaria a recorrer todo.
      qb.andWhere('s.saleNumber LIKE :prefijo', {
        prefijo: `${criteria.saleTypeCode}-%`,
      });
    }

    if (criteria.clientId) {
      qb.andWhere('s.clientId = :clientId', {
        clientId: criteria.clientId.value,
      });
    }

    if (criteria.districtId) {
      qb.andWhere('s.districtId = :distrito', {
        distrito: criteria.districtId,
      });
    }

    if (criteria.departmentId) {
      qb.andWhere('s.departmentId = :departamento', {
        departamento: criteria.departmentId,
      });
    }

    if (criteria.dates.from) {
      qb.andWhere('s.saleDate >= :desde', { desde: criteria.dates.from });
    }
    if (criteria.dates.to) {
      qb.andWhere('s.saleDate <= :hasta', { hasta: criteria.dates.to });
    }

    if (criteria.totals.min) {
      qb.andWhere('s.total >= :totalMin', {
        totalMin: criteria.totals.min.toDecimalString(),
      });
    }
    if (criteria.totals.max) {
      qb.andWhere('s.total <= :totalMax', {
        totalMax: criteria.totals.max.toDecimalString(),
      });
    }
  }

  /**
   * Reserva el correlativo y guarda la venta en una sola transaccion.
   *
   * El incremento se hace con un UPDATE ... RETURNING sobre la fila de
   * sale_types. Esa sentencia toma un bloqueo de fila, asi que dos ventas
   * simultaneas del mismo tipo se serializan: la segunda espera y obtiene el
   * numero siguiente. Leer con SELECT y luego escribir habria dejado una ventana
   * en la que ambas leen el mismo valor y chocan contra el UNIQUE de sale_number.
   *
   * Si el guardado falla, la transaccion revierte tambien el incremento: no
   * quedan huecos en la serie.
   */
  async emit(
    saleTypeId: number,
    armar: (numero: SaleNumber) => Sale,
  ): Promise<Sale> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const crudo: unknown = await manager.query(
        `UPDATE sale_types
            SET sale_type_correlative = lpad((sale_type_correlative::bigint + 1)::text, 10, '0')
          WHERE sale_type_id = $1
        RETURNING sale_type_code, sale_type_correlative`,
        [saleTypeId],
      );

      const filas = filasDeUpdate<{
        sale_type_code: string;
        sale_type_correlative: string;
      }>(crudo);

      if (filas.length === 0) {
        throw new SaleTypeNotFoundError(saleTypeId);
      }

      const codigo = filas[0].sale_type_code.trim();
      const correlativo = Number(filas[0].sale_type_correlative);
      if (correlativo > SaleNumber.MAX_CORRELATIVO) {
        throw new SaleSeriesExhaustedError(codigo);
      }

      const sale = armar(SaleNumber.emitir(codigo, correlativo));
      const { cabecera, lineas } = SaleMapper.toPersistence(sale);

      await manager.insert(SaleOrmEntity, cabecera);
      await manager.insert(SaleDetailOrmEntity, lineas);

      return sale;
    });
  }

  /**
   * Actualiza la cabecera y reemplaza las lineas.
   *
   * Las lineas se borran y reinsertan en vez de compararse una por una: el item
   * es parte de la clave primaria, asi que reordenar productos cambiaria las
   * claves y un `save` dejaria filas viejas conviviendo con las nuevas.
   */
  async update(sale: Sale): Promise<void> {
    const { cabecera, lineas } = SaleMapper.toPersistence(sale);

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.update(
        SaleOrmEntity,
        { saleId: cabecera.saleId },
        cabecera,
      );
      await manager.delete(SaleDetailOrmEntity, { saleId: cabecera.saleId });
      await manager.insert(SaleDetailOrmEntity, lineas);
    });
  }

  // --- SaleCatalog ---------------------------------------------------------

  async saleTypeCodeOf(saleTypeId: number): Promise<string | null> {
    const filas = await this.dataSource.query<{ sale_type_code: string }[]>(
      'SELECT sale_type_code FROM sale_types WHERE sale_type_id = $1',
      [saleTypeId],
    );
    return filas.length > 0 ? filas[0].sale_type_code.trim() : null;
  }

  async clientState(clientId: string): Promise<{ active: boolean } | null> {
    const row = await this.clients.findOne({
      where: { clientId },
      select: { clientId: true, clientActive: true },
    });
    return row ? { active: row.clientActive } : null;
  }

  async districtExists(districtId: string): Promise<boolean> {
    const filas = await this.dataSource.query<{ existe: boolean }[]>(
      'SELECT true AS existe FROM districts WHERE district_id = $1',
      [districtId],
    );
    return filas.length > 0;
  }

  async productsState(
    productIds: readonly string[],
  ): Promise<Map<string, { price: Money; active: boolean }>> {
    if (productIds.length === 0) return new Map();

    const filas = await this.products
      .createQueryBuilder('p')
      .select(['p.productId', 'p.productUnitPrice', 'p.productActive'])
      .where('p.productId IN (:...ids)', { ids: [...productIds] })
      .getMany();

    return new Map(
      filas.map((f) => [
        f.productId,
        {
          price: Money.fromDecimalString(f.productUnitPrice),
          active: f.productActive,
        },
      ]),
    );
  }
}
