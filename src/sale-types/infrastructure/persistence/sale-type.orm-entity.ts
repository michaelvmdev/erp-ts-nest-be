import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla de tipos de comprobante.
 *
 * `PrimaryColumn` y no `PrimaryGeneratedColumn`: los valores son fijos y vienen
 * del seed, no hay secuencia que TypeORM deba administrar.
 *
 * La columna del correlativo NO se declara. TypeORM solo lee las que conoce, asi
 * que dejarla fuera hace imposible que este modulo la exponga o la modifique por
 * accidente. Quien la toca es el modulo de ventas, con una sentencia atomica al
 * emitir.
 */
@Entity({ name: 'sale_types' })
export class SaleTypeOrmEntity {
  @PrimaryColumn({ name: 'sale_type_id', type: 'int' })
  saleTypeId!: number;

  @Column({ name: 'sale_type_description', type: 'varchar', length: 20 })
  saleTypeDescription!: string;

  @Column({ name: 'sale_type_code', type: 'char', length: 3 })
  saleTypeCode!: string;
}
