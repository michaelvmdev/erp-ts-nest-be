import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { PriceListItemOrmEntity } from './price-list-item.orm-entity';

@Entity({ name: 'price_lists' })
export class PriceListOrmEntity {
  @PrimaryColumn({ name: 'price_list_id', type: 'uuid' })
  priceListId!: string;

  @Column({ name: 'price_list_name', type: 'varchar', length: 100, unique: true })
  priceListName!: string;

  @Column({ name: 'price_list_description', type: 'varchar', length: 300, nullable: true })
  priceListDescription!: string | null;

  @Column({ name: 'price_list_active', type: 'boolean', default: true })
  priceListActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => PriceListItemOrmEntity, (item) => item.priceList, { eager: false })
  items?: PriceListItemOrmEntity[];
}
