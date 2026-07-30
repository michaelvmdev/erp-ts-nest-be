import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sales' })
export class SaleOrmEntity {
  @PrimaryColumn({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'sale_number', type: 'varchar', length: 14 })
  saleNumber!: string;

  /**
   * `date` y `time` se declaran como string y no como Date.
   *
   * Con Date, el driver interpretaria la fecha en la zona del servidor y una
   * venta del 1 de enero podria leerse como 31 de diciembre. La fecha de un
   * comprobante no tiene zona horaria: es la del lugar donde se emitio.
   */
  @Column({ name: 'sale_date', type: 'date' })
  saleDate!: string;

  @Column({ name: 'sale_hour', type: 'time' })
  saleHour!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'department_id', type: 'char', length: 2 })
  departmentId!: string;

  @Column({ name: 'province_id', type: 'char', length: 4 })
  provinceId!: string;

  @Column({ name: 'district_id', type: 'char', length: 6 })
  districtId!: string;

  // numeric como string, igual que en productos: el driver los devuelve asi para
  // no perder precision al pasarlos por un double.
  @Column({ name: 'sub_total', type: 'numeric', precision: 12, scale: 2 })
  subTotal!: string;

  @Column({ name: 'igv', type: 'numeric', precision: 12, scale: 2 })
  igv!: string;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: string;
}

@Entity({ name: 'sale_details' })
export class SaleDetailOrmEntity {
  // Clave primaria compuesta: la linea se identifica por su venta y su numero de
  // item, no por un id propio.
  @PrimaryColumn({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @PrimaryColumn({ name: 'item', type: 'int' })
  item!: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'partial', type: 'numeric', precision: 12, scale: 2 })
  partial!: string;
}
