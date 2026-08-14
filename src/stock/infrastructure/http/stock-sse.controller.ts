import { Controller, MessageEvent, Query, Sse, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Observable, from, of, switchMap, timer } from 'rxjs';
import { GetStockAlertsUseCase } from '../../application/get-stock-alerts.use-case';

/** SSE endpoint: EventSource can't send custom headers, so the JWT is passed as ?token=<jwt> */
@ApiTags('stock')
@Controller('stock')
export class StockSseController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly getStockAlerts: GetStockAlertsUseCase,
  ) {}

  @Sse('alerts/stream')
  @ApiOperation({
    summary: 'SSE — Stream de alertas de stock en tiempo real',
    description:
      'Emite un evento SSE cada 30 segundos con las alertas activas. ' +
      'Pasar el JWT como query param ?token=<jwt> (EventSource no admite cabeceras personalizadas).',
  })
  @ApiQuery({ name: 'token', required: true, description: 'JWT de autenticación' })
  alertsStream(@Query('token') token: string): Observable<MessageEvent> {
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    // timer(0, 30_000): first tick at 0ms (immediate), then every 30 s
    return timer(0, 30_000).pipe(
      switchMap(() =>
        from(this.getStockAlerts.execute()).pipe(
          switchMap((alerts) => of({ data: alerts } as MessageEvent)),
        ),
      ),
    );
  }
}
