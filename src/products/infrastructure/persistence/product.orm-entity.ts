import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BrandOrmEntity } from '../../../brands/infrastructure/persistence/brand.orm-entity';
import { CategoryOrmEntity } from '../../../categories/infrastructure/persistence/category.orm-entity';

/**
 * Modelo de persistencia. NO es el modelo de dominio.
 *
 * Existe solo para que TypeORM sepa leer y escribir las tablas; refleja el
 * esquema de db/db.sql tal cual, incluidos los nombres snake_case. El agregado
 * Product vive en domain/ y no sabe que esta clase existe: el mapeador traduce
 * entre ambos. Gracias a esa separacion, cambiar el motor de base de datos no
 * obliga a tocar una sola regla de negocio.
 *
 * Las columnas se nombran explicitamente en vez de confiar en una estrategia
 * automatica de nombres: es mas verboso, pero deja el mapeo a la vista y evita
 * sorpresas si alguien cambia la convencion global.
 */
@Entity({ name: 'products' })
export class ProductOrmEntity {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 100 })
  productName!: string;

  @Column({
    name: 'product_description',
    type: 'varchar',
    length: 250,
    nullable: true,
  })
  productDescription!: string | null;

  @Column({
    name: 'product_image',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  productImage!: string | null;

  /**
   * numeric(12,2) se declara como string a proposito. El driver de PostgreSQL
   * devuelve los numeric como texto justamente para no perder precision al
   * pasarlos por un double de JavaScript; convertirlo a number aca reintroduciria
   * ese error. El value object Money hace la conversion de forma exacta.
   */
  @Column({
    name: 'product_unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  productUnitPrice!: string;

  @Column({ name: 'product_active', type: 'boolean', default: true })
  productActive!: boolean;

  @ManyToOne(() => BrandOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id', referencedColumnName: 'brandId' })
  brand?: BrandOrmEntity;

  @ManyToOne(() => CategoryOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'categoryId' })
  category?: CategoryOrmEntity;
}
