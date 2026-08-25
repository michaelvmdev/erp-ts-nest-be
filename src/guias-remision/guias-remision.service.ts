import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { GuiaRemisionOrmEntity } from './infrastructure/persistence/guia-remision.orm-entity';

const MOTIVOS = ['VENTA', 'COMPRA', 'TRASLADO_ENTRE_ALMACENES', 'CONSIGNACION', 'DEVOLUCION', 'EXPOSICION', 'PRODUCCION', 'OTROS'];

@Injectable()
export class GuiasRemisionService {
  constructor(
    @InjectRepository(GuiaRemisionOrmEntity)
    private readonly repo: Repository<GuiaRemisionOrmEntity>,
  ) {}

  async list(page = 1, limit = 20, status?: string) {
    const qb = this.repo.createQueryBuilder('g').orderBy('g.createdAt', 'DESC');
    if (status) qb.andWhere('g.status = :status', { status });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(this.map), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(guiaId: string) {
    const g = await this.repo.findOne({ where: { guiaId } });
    if (!g) throw new NotFoundException(`Guía ${guiaId} no encontrada.`);
    return this.map(g);
  }

  async create(dto: {
    fechaTraslado: string;
    motivoTraslado: string;
    tipoTransporte?: string;
    rucTransportista?: string;
    placaVehiculo?: string;
    puntoPartida: string;
    puntoLlegada: string;
    saleId?: string;
    clientId?: string;
    items: Array<{ productId?: string; description: string; qty: number; unit: string }>;
    notes?: string;
  }) {
    const count = await this.repo.count();
    const g = new GuiaRemisionOrmEntity();
    g.guiaId          = randomUUID();
    g.serieNumero     = `T001-${String(count + 1).padStart(8, '0')}`;
    g.fechaEmision    = new Date().toISOString().slice(0, 10);
    g.fechaTraslado   = dto.fechaTraslado;
    g.motivoTraslado  = dto.motivoTraslado;
    g.tipoTransporte  = dto.tipoTransporte ?? 'PRIVADO';
    g.rucTransportista = dto.rucTransportista ?? null;
    g.placaVehiculo   = dto.placaVehiculo ?? null;
    g.puntoPartida    = dto.puntoPartida;
    g.puntoLlegada    = dto.puntoLlegada;
    g.saleId          = dto.saleId ?? null;
    g.clientId        = dto.clientId ?? null;
    g.status          = 'emitida';
    g.items           = dto.items;
    g.notes           = dto.notes ?? null;
    await this.repo.save(g);
    return this.map(g);
  }

  async anular(guiaId: string) {
    const g = await this.repo.findOne({ where: { guiaId } });
    if (!g) throw new NotFoundException(`Guía ${guiaId} no encontrada.`);
    g.status = 'anulada';
    await this.repo.save(g);
    return this.map(g);
  }

  motivos() { return MOTIVOS; }

  private map(g: GuiaRemisionOrmEntity) {
    return {
      guiaId:          g.guiaId,
      serieNumero:     g.serieNumero,
      fechaEmision:    g.fechaEmision,
      fechaTraslado:   g.fechaTraslado,
      motivoTraslado:  g.motivoTraslado,
      tipoTransporte:  g.tipoTransporte,
      rucTransportista:g.rucTransportista,
      placaVehiculo:   g.placaVehiculo,
      puntoPartida:    g.puntoPartida,
      puntoLlegada:    g.puntoLlegada,
      saleId:          g.saleId,
      clientId:        g.clientId,
      status:          g.status,
      items:           g.items,
      notes:           g.notes,
      createdAt:       g.createdAt,
    };
  }
}
