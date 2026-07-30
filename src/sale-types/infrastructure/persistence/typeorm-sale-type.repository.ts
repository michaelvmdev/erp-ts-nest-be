import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleType } from '../../domain/sale-type';
import { SaleTypeRepository } from '../../domain/sale-type.repository';
import { SaleTypeMapper } from './sale-type.mapper';
import { SaleTypeOrmEntity } from './sale-type.orm-entity';

@Injectable()
export class TypeOrmSaleTypeRepository implements SaleTypeRepository {
  constructor(
    @InjectRepository(SaleTypeOrmEntity)
    private readonly saleTypes: Repository<SaleTypeOrmEntity>,
  ) {}

  async findAll(): Promise<SaleType[]> {
    // Por id y no por descripcion: el orden del catalogo es el que le dio el
    // negocio (primero factura, despues boleta), no el alfabetico.
    const rows = await this.saleTypes.find({ order: { saleTypeId: 'ASC' } });
    return rows.map((row) => SaleTypeMapper.toDomain(row));
  }
}
