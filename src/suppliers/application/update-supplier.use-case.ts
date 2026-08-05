import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from '../domain/supplier';
import {
  SupplierNotFoundError,
  SupplierRucAlreadyExistsError,
} from '../domain/supplier.errors';
import { SUPPLIER_REPOSITORY } from '../domain/supplier.repository';
import type { SupplierRepository } from '../domain/supplier.repository';
import { SupplierDescription } from '../domain/value-objects/supplier-description.value-object';
import { SupplierId } from '../domain/value-objects/supplier-id.value-object';
import { SupplierRuc } from '../domain/value-objects/supplier-ruc.value-object';
import { UpdateSupplierCommand } from './supplier.commands';

@Injectable()
export class UpdateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(
    rawSupplierId: string,
    command: UpdateSupplierCommand,
  ): Promise<Supplier> {
    const id = SupplierId.of(rawSupplierId);

    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, no por veracidad, para que
    // `false` se aplique como el valor legitimo que es. Justamente el caso de
    // desactivar el proveedor.
    if (command.supplierDescription !== undefined) {
      supplier.rename(SupplierDescription.of(command.supplierDescription));
    }

    if (command.supplierRuc !== undefined) {
      const ruc = SupplierRuc.of(command.supplierRuc);

      // Se excluye el propio proveedor de la busqueda: corregir el RUC sin
      // cambiar el numero no debe chocar consigo mismo.
      const otro = await this.suppliers.findByRuc(ruc, id);
      if (otro) {
        throw new SupplierRucAlreadyExistsError(ruc.value);
      }
      supplier.changeRuc(ruc);
    }

    if (command.supplierActive !== undefined) {
      if (command.supplierActive) {
        supplier.activate();
      } else {
        supplier.deactivate();
      }
    }

    await this.suppliers.update(supplier);
    return supplier;
  }
}
