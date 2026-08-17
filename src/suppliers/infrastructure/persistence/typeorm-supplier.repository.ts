import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../../shared/domain/pagination';
import { Supplier } from '../../domain/supplier';
import { SupplierSearchCriteria } from '../../domain/supplier-search.criteria';
import { SupplierRepository } from '../../domain/supplier.repository';
import { SupplierId } from '../../domain/value-objects/supplier-id.value-object';
import { SupplierRuc } from '../../domain/value-objects/supplier-ruc.value-object';
import { SupplierMapper } from './supplier.mapper';
import { SupplierOrmEntity } from './supplier.orm-entity';

/**
 * Adaptador de salida: implementa el puerto SupplierRepository con TypeORM.
 *
 * Es la unica clase del modulo que sabe que hay PostgreSQL detras. Aqui es donde
 * los errores del motor se traducen a errores de dominio, para que ni los casos
 * de uso ni el controlador tengan que conocer codigos SQLSTATE.
 */
@Injectable()
export class TypeOrmSupplierRepository implements SupplierRepository {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly suppliers: Repository<SupplierOrmEntity>,
  ) {}

  async findById(id: SupplierId): Promise<Supplier | null> {
    const row = await this.suppliers.findOne({
      where: { supplierId: id.value },
    });
    return row ? SupplierMapper.toDomain(row) : null;
  }

  async search(criteria: SupplierSearchCriteria): Promise<Page<Supplier>> {
    const qb = this.suppliers.createQueryBuilder('s');

    if (criteria.description) {
      // El comodin va como parametro, nunca concatenado en el SQL.
      qb.andWhere('s.supplierDescription ILIKE :descripcion', {
        descripcion: `%${criteria.description}%`,
      });
    }

    if (criteria.ruc) {
      qb.andWhere('s.supplierRuc = :ruc', { ruc: criteria.ruc });
    }

    if (criteria.active !== null) {
      qb.andWhere('s.supplierActive = :activo', { activo: criteria.active });
    }

    qb.orderBy('s.supplierDescription', criteria.sortDirection)
      // Desempate por clave primaria: sin esto, dos proveedores homonimos
      // podrian alternar de pagina entre consultas y el paginado repetiria o
      // saltearia.
      .addOrderBy('s.supplierId', 'ASC')
      .skip(criteria.page.offset)
      .take(criteria.page.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new Page(
      rows.map((row) => SupplierMapper.toDomain(row)),
      total,
      criteria.page.page,
      criteria.page.limit,
    );
  }

  async findByRuc(
    ruc: SupplierRuc,
    excludeId?: SupplierId,
  ): Promise<Supplier | null> {
    const qb = this.suppliers
      .createQueryBuilder('s')
      .where('s.supplierRuc = :ruc', { ruc: ruc.value });

    if (excludeId) {
      qb.andWhere('s.supplierId <> :excluido', { excluido: excludeId.value });
    }

    const row = await qb.getOne();
    return row ? SupplierMapper.toDomain(row) : null;
  }

  async insert(supplier: Supplier): Promise<void> {
    await this.suppliers.insert(SupplierMapper.toPersistence(supplier));
  }

  async update(supplier: Supplier): Promise<void> {
    await this.suppliers.save(SupplierMapper.toPersistence(supplier));
  }

  async delete(id: SupplierId): Promise<void> {
    await this.suppliers.softDelete({ supplierId: id.value });
  }
}
