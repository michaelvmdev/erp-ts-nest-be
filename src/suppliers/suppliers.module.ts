import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateSupplierUseCase } from './application/create-supplier.use-case';
import { DeleteSupplierUseCase } from './application/delete-supplier.use-case';
import { FindSupplierUseCase } from './application/find-supplier.use-case';
import { ListSuppliersUseCase } from './application/list-suppliers.use-case';
import { UpdateSupplierUseCase } from './application/update-supplier.use-case';
import { SUPPLIER_REPOSITORY } from './domain/supplier.repository';
import { SuppliersController } from './infrastructure/http/suppliers.controller';
import { SupplierOrmEntity } from './infrastructure/persistence/supplier.orm-entity';
import { TypeOrmSupplierRepository } from './infrastructure/persistence/typeorm-supplier.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierOrmEntity])],
  controllers: [SuppliersController],
  providers: [
    TypeOrmSupplierRepository,
    { provide: SUPPLIER_REPOSITORY, useExisting: TypeOrmSupplierRepository },
    FindSupplierUseCase,
    ListSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
  ],
  // Un futuro modulo de compras necesitaria la entidad ORM de proveedores para
  // su comprobacion de existencia; se exporta desde aqui para que haya una
  // sola definicion, igual que brands y categories.
  exports: [TypeOrmModule],
})
export class SuppliersModule {}
