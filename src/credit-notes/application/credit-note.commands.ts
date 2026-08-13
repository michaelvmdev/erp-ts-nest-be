export interface CreditNoteLineCommand {
  readonly productId: string;
  readonly quantity: number;
}

export interface CreateCreditNoteCommand {
  readonly saleId: string;
  readonly reason: string;
  readonly creditNoteDate?: string;
  readonly creditNoteHour?: string;
  readonly creditNoteDetails: readonly CreditNoteLineCommand[];
  readonly warehouseId?: string;
}

export interface SearchCreditNotesQuery {
  readonly saleId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}
