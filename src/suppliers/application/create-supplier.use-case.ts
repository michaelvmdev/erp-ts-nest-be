import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Supplier } from '../domain/supplier';
import { SupplierRucAlreadyExistsError } from '../domain/supplier.errors';
import { SUPPLIER_REPOSITORY } from '../domain/supplier.repository';
import type { SupplierRepository } from '../domain/supplier.repository';
import { SupplierDescription } from '../domain/value-objects/supplier-description.value-object';
import { SupplierId } from '../domain/value-objects/supplier-id.value-object';
import { SupplierRuc } from '../domain/value-objects/supplier-ruc.value-object';
import { CreateSupplierCommand } from './supplier.commands';

@Injectable()
export class CreateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(command: CreateSupplierCommand): Promise<Supplier> {
    const description = SupplierDescription.of(command.supplierDescription);
    const ruc = SupplierRuc.of(command.supplierRuc);

    const existente = await this.suppliers.findByRuc(ruc);
    if (existente) {
      throw new SupplierRucAlreadyExistsError(ruc.value);
    }

    // El id lo genera el backend, igual que en marcas, categorias y productos.
    const supplier = Supplier.create({
      id: SupplierId.of(randomUUID()),
      description,
      ruc,
      active: command.supplierActive,
    });

    await this.suppliers.insert(supplier);
    return supplier;
  }
}
