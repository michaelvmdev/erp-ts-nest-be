import { MonthPeriod } from './month-period';

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
 * Puerto de salida del tablero.
 *
 * Los `top*` devuelven `null` cuando el mes no tiene ventas: un tablero muestra
 * "sin datos", no un 404. `totalSales` en cambio siempre responde, con cero.
 */
export interface DashboardRepository {
  totalSales(period: MonthPeriod): Promise<TotalSales>;
  topProduct(period: MonthPeriod): Promise<TopProduct | null>;
  topDepartment(period: MonthPeriod): Promise<TopDepartment | null>;
  topClient(period: MonthPeriod): Promise<TopClient | null>;
}

export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');
