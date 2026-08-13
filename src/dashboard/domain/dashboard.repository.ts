import { MonthPeriod } from './month-period';
import { YearPeriod } from './year-period';

/**
 * Read models del tablero. No son agregados de dominio: son el resultado plano
 * de consultas agregadas sobre las ventas del mes, el lado de lectura de CQRS.
 * Por eso viven junto al puerto y no tienen `rehydrate` ni value objects.
 *
 * Los importes viajan como string, igual que en el resto del proyecto: el driver
 * devuelve los `numeric` como texto para no perder precision al pasarlos por un
 * double de JavaScript.
 */

export interface TotalSales {
  period: string;
  amount: string;
  count: number;
}

export interface TopProduct {
  period: string;
  productId: string;
  productName: string;
  unitsSold: number;
}

export interface TopDepartment {
  period: string;
  departmentId: string;
  departmentDescription: string;
  totalAmount: string;
}

export interface TopClient {
  period: string;
  clientId: string;
  clientDescription: string;
  totalAmount: string;
}

/**
 * Read models de los diagramas anuales. Cada serie trae los doce meses del ano,
 * incluidos los que no tuvieron ventas (con total en cero), para que el eje del
 * grafico quede completo del lado del front.
 */

export interface MonthlyAmount {
  /** Mes del 1 (enero) al 12 (diciembre). */
  month: number;
  /** Suma de importes del mes. Cadena decimal; "0.00" si no hubo ventas. */
  total: string;
}

export interface YearlyAmount {
  /** Ano calendario de la venta. */
  year: number;
  /** Suma de importes del ano. Cadena decimal; "0.00" si no hubo ventas. */
  total: string;
}

export interface MonthlyTopProduct {
  /** Mes del 1 (enero) al 12 (diciembre). */
  month: number;
  /** `null` si el mes no tuvo ventas. */
  productId: string | null;
  productName: string | null;
  productDescription: string | null;
  /** Unidades del producto lider en el mes; 0 si el mes no tuvo ventas. */
  unitsSold: number;
}

/** Filtro de localidad para el diagrama de ventas por ubigeo. */
export interface UbigeoFilter {
  departmentId: string;
  provinceId?: string;
  districtId?: string;
}

/**
 * Read models del lado de compras. Espejan a los de ventas, con dos diferencias
 * que impone el modelo de datos: la contraparte de "cliente" es el proveedor
 * (`suppliers`), y las compras no tienen ubigeo, asi que no hay indicador por
 * departamento ni serie por localidad.
 */

export interface TotalPurchases {
  period: string;
  amount: string;
  count: number;
}

export interface TopPurchasedProduct {
  period: string;
  productId: string;
  productName: string;
  unitsPurchased: number;
}

export interface TopSupplier {
  period: string;
  supplierId: string;
  supplierDescription: string;
  totalAmount: string;
}

export interface MonthlyTopPurchasedProduct {
  /** Mes del 1 (enero) al 12 (diciembre). */
  month: number;
  /** `null` si el mes no tuvo compras. */
  productId: string | null;
  productName: string | null;
  productDescription: string | null;
  /** Unidades del producto mas comprado en el mes; 0 si no hubo compras. */
  unitsPurchased: number;
}

export interface ProfitabilityRow {
  readonly productId: string;
  readonly productName: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly unitsSold: number;
  readonly totalRevenue: string;
  readonly avgCost: string | null;
  readonly totalCost: string | null;
  readonly marginPct: string | null;
}

export interface MonthComparison {
  readonly year: number;
  readonly month: number;
  readonly currentAmount: string;
  readonly currentCount: number;
  readonly prevAmount: string;
  readonly prevCount: number;
  readonly prevYearAmount: string;
  readonly prevYearCount: number;
  readonly momPct: string | null;
  readonly yoyPct: string | null;
}

/**
 * Puerto de salida del tablero.
 *
 * Los `top*` devuelven `null` cuando el mes no tiene ventas: un tablero muestra
 * "sin datos", no un 404. `totalSales` en cambio siempre responde, con cero.
 *
 * Los diagramas anuales devuelven siempre una serie de doce meses.
 */
export interface DashboardRepository {
  totalSales(period: MonthPeriod): Promise<TotalSales>;
  topProduct(period: MonthPeriod): Promise<TopProduct | null>;
  topDepartment(period: MonthPeriod): Promise<TopDepartment | null>;
  topClient(period: MonthPeriod): Promise<TopClient | null>;

  monthlySales(period: YearPeriod): Promise<MonthlyAmount[]>;
  monthlySalesByUbigeo(
    period: YearPeriod,
    ubigeo: UbigeoFilter,
  ): Promise<MonthlyAmount[]>;
  monthlySalesByCategory(
    period: YearPeriod,
    categoryId: string,
  ): Promise<MonthlyAmount[]>;
  topProductByMonth(period: YearPeriod): Promise<MonthlyTopProduct[]>;
  yearlySales(): Promise<YearlyAmount[]>;

  totalPurchases(period: MonthPeriod): Promise<TotalPurchases>;
  topPurchasedProduct(period: MonthPeriod): Promise<TopPurchasedProduct | null>;
  topSupplier(period: MonthPeriod): Promise<TopSupplier | null>;

  monthlyPurchases(period: YearPeriod): Promise<MonthlyAmount[]>;
  monthlyPurchasesByCategory(
    period: YearPeriod,
    categoryId: string,
  ): Promise<MonthlyAmount[]>;
  topPurchasedProductByMonth(
    period: YearPeriod,
  ): Promise<MonthlyTopPurchasedProduct[]>;
  yearlyPurchases(): Promise<YearlyAmount[]>;

  profitability(dateFrom?: string, dateTo?: string): Promise<ProfitabilityRow[]>;
  monthComparison(year: number, month: number): Promise<MonthComparison>;
}

export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');
