import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PriceListOrmEntity } from './price-list.orm-entity';

@Entity({ name: 'price_list_items' })
export class PriceListItemOrmEntity {
  @PrimaryColumn({ name: 'price_list_id', type: 'uuid' })
  priceListId!: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string; // TypeORM devuelve numeric como string; se parsea en el mapper

  @ManyToOne(() => PriceListOrmEntity, (pl) => pl.items)
  @JoinColumn({ name: 'price_list_id' })
  priceList?: PriceListOrmEntity;
}
