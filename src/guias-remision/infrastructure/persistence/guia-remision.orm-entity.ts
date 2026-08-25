import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('guias_remision')
export class GuiaRemisionOrmEntity {
  @PrimaryColumn('uuid') guiaId!: string;
  @Column({ length: 20, unique: true }) serieNumero!: string;
  @Column({ type: 'date' })             fechaEmision!: string;
  @Column({ type: 'date' })             fechaTraslado!: string;
  @Column({ length: 60 })               motivoTraslado!: string;
  @Column({ length: 20, default: 'PRIVADO' }) tipoTransporte!: string;
  @Column({ length: 20, nullable: true }) rucTransportista!: string | null;
  @Column({ length: 30, nullable: true }) placaVehiculo!: string | null;
  @Column({ length: 200 })              puntoPartida!: string;
  @Column({ length: 200 })              puntoLlegada!: string;
  @Column({ type: 'uuid', nullable: true }) saleId!: string | null;
  @Column({ type: 'uuid', nullable: true }) clientId!: string | null;
  @Column({ length: 20, default: 'emitida' }) status!: string;
  @Column({ type: 'jsonb', default: '[]' }) items!: object;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
