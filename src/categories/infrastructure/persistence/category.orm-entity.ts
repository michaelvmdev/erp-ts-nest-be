import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `categories`.
 *
 * Vive en este modulo y products lo importa. Tener dos clases @Entity apuntando
 * a la misma tabla funciona por accidente pero invita a que se desincronicen:
 * una sola definicion es la fuente de verdad.
 */
@Entity({ name: 'categories' })
export class CategoryOrmEntity {
  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'category_description', type: 'varchar', length: 100 })
  categoryDescription!: string;

  @Column({ name: 'category_active', type: 'boolean', default: true })
  categoryActive!: boolean;
}
