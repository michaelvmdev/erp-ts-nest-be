import { QuoteStatus } from '../domain/quote';

export interface CreateQuoteDetailItem {
  item: number;
  productId: string;
  quantity: number;
}

export interface CreateQuoteCommand {
  clientId: string;
  date?: string;
  validUntil: string;
  notes?: string;
  details: CreateQuoteDetailItem[];
}

export interface UpdateQuoteStatusCommand {
  quoteId: string;
  status: Exclude<QuoteStatus, 'draft'>;
}
