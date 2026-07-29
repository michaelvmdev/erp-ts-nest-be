import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `brands`.
 *
 * Vive en este modulo y products lo importa. Tener dos clases @Entity apuntando
 * a la misma tabla funciona por accidente pero invita a que se desincronicen:
 * una sola definicion es la fuente de verdad.
 */
@Entity({ name: 'brands' })
export class BrandOrmEntity {
  @PrimaryColumn({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @Column({ name: 'brand_description', type: 'varchar', length: 50 })
  brandDescription!: string;

  @Column({ name: 'brand_active', type: 'boolean', default: true })
  brandActive!: boolean;
}
