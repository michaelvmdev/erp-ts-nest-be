import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Product } from '../../domain/product';
import { ProductSearchCriteria } from '../../domain/product-search.criteria';
import { ProductInUseError } from '../../domain/product.errors';
import {
  BrandExistenceChecker,
  ProductRepository,
} from '../../domain/product.repository';
import {
  BrandId,
  ProductId,
} from '../../domain/value-objects/identifiers.value-object';
import { ProductMapper } from './product.mapper';
import { BrandOrmEntity, ProductOrmEntity } from './product.orm-entity';

/** Violacion de clave foranea en PostgreSQL. */
const PG_FOREIGN_KEY_VIOLATION = '23503';

function esErrorPostgres(error: unknown, codigo: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === codigo
  );
}

/**
 * Adaptador de salida: implementa el puerto ProductRepository con TypeORM.
 *
 * Es la unica clase del modulo que sabe que hay PostgreSQL detras. Aqui es donde
 * los errores del motor se traducen a errores de dominio, para que ni los casos
 * de uso ni el controlador tengan que conocer codigos SQLSTATE.
 */
@Injectable()
export class TypeOrmProductRepository
  implements ProductRepository, BrandExistenceChecker
{
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly products: Repository<ProductOrmEntity>,
    @InjectRepository(BrandOrmEntity)
    private readonly brands: Repository<BrandOrmEntity>,
  ) {}

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.products.findOne({ where: { productId: id.value } });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async search(criteria: ProductSearchCriteria): Promise<Page<Product>> {
    const qb = this.products.createQueryBuilder('p');
    this.aplicarFiltros(qb, criteria);

    const columna =
      criteria.sortBy === 'unitPrice' ? 'p.productUnitPrice' : 'p.productName';
    qb.orderBy(columna, criteria.sortDirection)
      // Desempate por clave primaria: sin esto, dos productos con el mismo
      // nombre pueden alternar de pagina entre consultas y el paginado repite
      // o se saltea filas.
      .addOrderBy('p.productId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => ProductMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  private aplicarFiltros(
    qb: SelectQueryBuilder<ProductOrmEntity>,
    criteria: ProductSearchCriteria,
  ): void {
    if (criteria.description) {
      // ILIKE: insensible a mayusculas. El comodin va como parametro, nunca
      // concatenado, para que no haya forma de inyectar SQL desde el filtro.
      qb.andWhere('p.productDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.priceRange.min) {
      qb.andWhere('p.productUnitPrice >= :precioMin', {
        precioMin: criteria.priceRange.min.toDecimalString(),
      });
    }

    if (criteria.priceRange.max) {
      qb.andWhere('p.productUnitPrice <= :precioMax', {
        precioMax: criteria.priceRange.max.toDecimalString(),
      });
    }

    if (criteria.brandId) {
      qb.andWhere('p.brandId = :brandId', { brandId: criteria.brandId.value });
    }

    if (criteria.active !== null) {
      qb.andWhere('p.productActive = :activo', { activo: criteria.active });
    }
  }

  async insert(product: Product): Promise<void> {
    await this.products.insert(ProductMapper.toPersistence(product));
  }

  async update(product: Product): Promise<void> {
    const row = ProductMapper.toPersistence(product);
    // save() con la clave primaria presente hace UPDATE. No se usa update()
    // parcial porque el agregado ya viene completo y consistente.
    await this.products.save(row);
  }

  async delete(id: ProductId): Promise<void> {
    try {
      await this.products.delete({ productId: id.value });
    } catch (error) {
      if (esErrorPostgres(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ProductInUseError(id.value);
      }
      throw error;
    }
  }

  async exists(brandId: BrandId): Promise<boolean> {
    return this.brands.existsBy({ brandId: brandId.value });
  }
}
