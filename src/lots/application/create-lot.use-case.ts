import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Lot } from '../domain/lot';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';
import { LotId } from '../domain/value-objects/lot-id.value-object';
import { CreateLotCommand } from './lot.commands';

@Injectable()
export class CreateLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(cmd: CreateLotCommand): Promise<Lot> {
    const lot = Lot.create({
      id: LotId.of(randomUUID()),
      lotNumber: cmd.lotNumber,
      productId: cmd.productId,
      warehouseId: cmd.warehouseId,
      manufacturingDate: cmd.manufacturingDate,
      expirationDate: cmd.expirationDate,
      initialQuantity: cmd.initialQuantity,
      notes: cmd.notes,
    });
    await this.lots.save(lot);
    return lot;
  }
}
