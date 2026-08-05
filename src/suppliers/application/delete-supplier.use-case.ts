import { Inject, Injectable } from '@nestjs/common';
import { SupplierNotFoundError } from '../domain/supplier.errors';
import { SUPPLIER_REPOSITORY } from '../domain/supplier.repository';
import type { SupplierRepository } from '../domain/supplier.repository';
import { SupplierId } from '../domain/value-objects/supplier-id.value-object';

@Injectable()
export class DeleteSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute(rawSupplierId: string): Promise<void> {
    const id = SupplierId.of(rawSupplierId);

    // Se consulta antes de borrar para distinguir 404 ("no existe") de 204
    // ("existia y se borro"). Sin esta lectura, un DELETE sobre un id inexistente
    // devolveria 204 y el cliente creeria que borro algo.
    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError(id.value);
    }

    // Si el proveedor figura en compras, el adaptador traduce la violacion de
    // clave foranea a SupplierInUseError y el filtro responde 409.
    await this.suppliers.delete(id);
  }
}
