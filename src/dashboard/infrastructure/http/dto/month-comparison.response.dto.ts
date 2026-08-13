import type { MonthComparison } from '../../../domain/dashboard.repository';

export class MonthComparisonResponseDto {
  year!: number;
  month!: number;
  currentAmount!: string;
  currentCount!: number;
  prevAmount!: string;
  prevCount!: number;
  prevYearAmount!: string;
  prevYearCount!: number;
  momPct!: string | null;
  yoyPct!: string | null;

  static from(m: MonthComparison): MonthComparisonResponseDto {
    return Object.assign(new MonthComparisonResponseDto(), m);
  }
}
