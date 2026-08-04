import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `provinces`.
 *
 * Incluye `department_id`: es la clave foranea al departamento y lo que filtra
 * el listado por departamento.
 */
@Entity({ name: 'provinces' })
export class ProvinceOrmEntity {
  @PrimaryColumn({ name: 'province_id', type: 'char', length: 4 })
  provinceId!: string;

  @Column({ name: 'department_id', type: 'char', length: 2 })
  departmentId!: string;

  @Column({ name: 'province_description', type: 'varchar', length: 100 })
  provinceDescription!: string;
}
