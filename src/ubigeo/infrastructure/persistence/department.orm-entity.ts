import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `departments`.
 *
 * El identificador es char(2) y se declara con PrimaryColumn, no
 * PrimaryGeneratedColumn: los codigos son fijos y vienen del padron INEI
 * sembrado por db/db.sql, no de una secuencia.
 */
@Entity({ name: 'departments' })
export class DepartmentOrmEntity {
  @PrimaryColumn({ name: 'department_id', type: 'char', length: 2 })
  departmentId!: string;

  @Column({ name: 'department_description', type: 'varchar', length: 100 })
  departmentDescription!: string;
}
