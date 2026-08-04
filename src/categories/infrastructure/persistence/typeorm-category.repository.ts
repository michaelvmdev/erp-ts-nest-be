import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Category } from '../../domain/category';
import { CategorySearchCriteria } from '../../domain/category-search.criteria';
import { CategoryInUseError } from '../../domain/category.errors';
import { CategoryRepository } from '../../domain/category.repository';
import { CategoryDescription } from '../../domain/value-objects/category-description.value-object';
import { CategoryId } from '../../domain/value-objects/category-id.value-object';
import { CategoryMapper } from './category.mapper';
import { CategoryOrmEntity } from './category.orm-entity';

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
 * Adaptador de salida: implementa el puerto CategoryRepository con TypeORM.
 *
 * Es la unica clase del modulo que sabe que hay PostgreSQL detras. Aqui es donde
 * los errores del motor se traducen a errores de dominio, para que ni los casos
 * de uso ni el controlador tengan que conocer codigos SQLSTATE.
 */
@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly categories: Repository<CategoryOrmEntity>,
  ) {}

  async findById(id: CategoryId): Promise<Category | null> {
    const row = await this.categories.findOne({
      where: { categoryId: id.value },
    });
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async search(criteria: CategorySearchCriteria): Promise<Page<Category>> {
    const qb = this.categories.createQueryBuilder('c');

    if (criteria.description) {
      // El comodin va como parametro, nunca concatenado en el SQL.
      qb.andWhere('c.categoryDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.active !== null) {
      qb.andWhere('c.categoryActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('c.categoryDescription', criteria.sortDirection)
      // Desempate por clave primaria: sin esto, dos categorias homonimas podrian
      // alternar de pagina entre consultas y el paginado repetiria o saltearia.
      .addOrderBy('c.categoryId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => CategoryMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async findByDescription(
    description: CategoryDescription,
    excludeId?: CategoryId,
  ): Promise<Category | null> {
    const qb = this.categories
      .createQueryBuilder('c')
      // LOWER(TRIM(...)) replica en SQL la normalizacion de comparisonKey, para
      // que la unicidad se evalue igual en el dominio y en la base.
      .where('LOWER(TRIM(c.categoryDescription)) = :clave', {
        clave: description.comparisonKey,
      });

    if (excludeId) {
      qb.andWhere('c.categoryId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async insert(category: Category): Promise<void> {
    await this.categories.insert(CategoryMapper.toPersistence(category));
  }

  async update(category: Category): Promise<void> {
    await this.categories.save(CategoryMapper.toPersistence(category));
  }

  async delete(id: CategoryId): Promise<void> {
    try {
      await this.categories.delete({ categoryId: id.value });
    } catch (error) {
      if (esErrorPostgres(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new CategoryInUseError(id.value);
      }
      throw error;
    }
  }
}
