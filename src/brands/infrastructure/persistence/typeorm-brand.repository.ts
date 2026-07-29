import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Brand } from '../../domain/brand';
import { BrandSearchCriteria } from '../../domain/brand-search.criteria';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandDescription } from '../../domain/value-objects/brand-description.value-object';
import { BrandId } from '../../domain/value-objects/brand-id.value-object';
import { BrandMapper } from './brand.mapper';
import { BrandOrmEntity } from './brand.orm-entity';

@Injectable()
export class TypeOrmBrandRepository implements BrandRepository {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly brands: Repository<BrandOrmEntity>,
  ) {}

  async findById(id: BrandId): Promise<Brand | null> {
    const row = await this.brands.findOne({ where: { brandId: id.value } });
    return row ? BrandMapper.toDomain(row) : null;
  }

  async search(criteria: BrandSearchCriteria): Promise<Page<Brand>> {
    const qb = this.brands.createQueryBuilder('b');

    if (criteria.description) {
      // El comodin va como parametro, nunca concatenado en el SQL.
      qb.andWhere('b.brandDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.active !== null) {
      qb.andWhere('b.brandActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('b.brandDescription', criteria.sortDirection)
      // Desempate por clave primaria: sin esto, dos marcas homonimas podrian
      // alternar de pagina entre consultas y el paginado repetiria o saltearia.
      .addOrderBy('b.brandId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => BrandMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async findByDescription(
    description: BrandDescription,
    excludeId?: BrandId,
  ): Promise<Brand | null> {
    const qb = this.brands
      .createQueryBuilder('b')
      // LOWER(TRIM(...)) replica en SQL la normalizacion de comparisonKey, para
      // que la unicidad se evalue igual en el dominio y en la base.
      .where('LOWER(TRIM(b.brandDescription)) = :clave', {
        clave: description.comparisonKey,
      });

    if (excludeId) {
      qb.andWhere('b.brandId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? BrandMapper.toDomain(row) : null;
  }

  async insert(brand: Brand): Promise<void> {
    await this.brands.insert(BrandMapper.toPersistence(brand));
  }

  async update(brand: Brand): Promise<void> {
    await this.brands.save(BrandMapper.toPersistence(brand));
  }
}
