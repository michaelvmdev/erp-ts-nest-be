import type { ProfitabilityRow } from '../../../domain/dashboard.repository';

export class ProfitabilityRowDto {
  productId!: string;
  productName!: string;
  categoryId!: string;
  categoryName!: string;
  unitsSold!: number;
  totalRevenue!: string;
  avgCost!: string | null;
  totalCost!: string | null;
  marginPct!: string | null;

  static from(r: ProfitabilityRow): ProfitabilityRowDto {
    return Object.assign(new ProfitabilityRowDto(), r);
  }
}
