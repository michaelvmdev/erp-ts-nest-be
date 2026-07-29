import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `document_types`.
 *
 * El identificador se declara con PrimaryColumn y no con PrimaryGeneratedColumn
 * porque los valores son fijos y vienen del seed de db/db.sql: no hay secuencia
 * que TypeORM deba administrar.
 */
@Entity({ name: 'document_types' })
export class DocumentTypeOrmEntity {
  @PrimaryColumn({ name: 'document_type_id', type: 'int' })
  documentTypeId!: number;

  @Column({ name: 'document_type_description', type: 'varchar', length: 20 })
  documentTypeDescription!: string;
}
