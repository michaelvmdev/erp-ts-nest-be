import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { CreditNote } from '../domain/credit-note';
import { CreditNoteLine } from '../domain/credit-note-line';
import {
  CreditNoteProductNotInSaleError,
  CreditNoteSaleNotFoundError,
} from '../domain/credit-note.errors';
import {
  CREDIT_NOTE_CATALOG,
  CREDIT_NOTE_REPOSITORY,
} from '../domain/credit-note.repository';
import type {
  CreditNoteCatalog,
  CreditNoteRepository,
} from '../domain/credit-note.repository';
import { CreditNoteId } from '../domain/value-objects/credit-note-id.value-object';
import { CreateCreditNoteCommand } from './credit-note.commands';

@Injectable()
export class CreateCreditNoteUseCase {
  constructor(
    @Inject(CREDIT_NOTE_REPOSITORY)
    private readonly creditNotes: CreditNoteRepository,
    @Inject(CREDIT_NOTE_CATALOG)
    private readonly catalogo: CreditNoteCatalog,
  ) {}

  async execute(command: CreateCreditNoteCommand): Promise<CreditNote> {
    const exists = await this.catalogo.saleExists(command.saleId);
    if (!exists) throw new CreditNoteSaleNotFoundError(command.saleId);

    const saleLines = await this.catalogo.saleLinesMap(command.saleId);

    const lineas: CreditNoteLine[] = command.creditNoteDetails.map((d, i) => {
      const saleDetail = saleLines.get(d.productId);
      if (!saleDetail) throw new CreditNoteProductNotInSaleError(d.productId);
      return CreditNoteLine.of({
        item: i + 1,
        productId: ProductId.of(d.productId),
        quantity: d.quantity,
        unitPrice: saleDetail.unitPrice,
      });
    });

    const { fecha, hora } = momentoDeEmision(command);

    return this.creditNotes.emit(command.saleId, (numero) =>
      CreditNote.create({
        id: CreditNoteId.of(randomUUID()),
        saleId: command.saleId,
        number: numero,
        date: fecha,
        hour: hora,
        reason: command.reason,
        lines: lineas,
      }),
    );
  }
}

function momentoDeEmision(command: CreateCreditNoteCommand): { fecha: string; hora: string } {
  const ahora = new Date();
  const dd = (n: number) => String(n).padStart(2, '0');
  return {
    fecha: command.creditNoteDate ??
      `${ahora.getFullYear()}-${dd(ahora.getMonth() + 1)}-${dd(ahora.getDate())}`,
    hora: command.creditNoteHour ??
      `${dd(ahora.getHours())}:${dd(ahora.getMinutes())}:${dd(ahora.getSeconds())}`,
  };
}
