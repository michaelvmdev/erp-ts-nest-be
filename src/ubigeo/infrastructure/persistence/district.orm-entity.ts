import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Modelo de persistencia de la tabla `districts`.
 *
 * Incluye `province_id`: es la clave foranea a la provincia y lo que filtra el
 * listado por provincia.
 */
@Entity({ name: 'districts' })
export class DistrictOrmEntity {
  @PrimaryColumn({ name: 'district_id', type: 'char', length: 6 })
  districtId!: string;

  @Column({ name: 'province_id', type: 'char', length: 4 })
  provinceId!: string;

  @Column({ name: 'district_description', type: 'varchar', length: 100 })
  districtDescription!: string;
}
