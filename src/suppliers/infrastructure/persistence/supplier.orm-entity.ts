import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `suppliers`.
 *
 * Vive en este modulo y purchases lo importa. Tener dos clases @Entity
 * apuntando a la misma tabla funciona por accidente pero invita a que se
 * desincronicen: una sola definicion es la fuente de verdad.
 */
@Entity({ name: 'suppliers' })
export class SupplierOrmEntity {
  @PrimaryColumn({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'supplier_description', type: 'varchar', length: 150 })
  supplierDescription!: string;

  @Column({ name: 'supplier_ruc', type: 'char', length: 11 })
  supplierRuc!: string;

  @Column({ name: 'supplier_active', type: 'boolean', default: true })
  supplierActive!: boolean;
}
