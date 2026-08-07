import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUUID, Matches, MaxLength } from 'class-validator';

/**
 * Parametros de `POST /purchases/purchases-by-supplier-report/send-email`.
 *
 * El reporte es siempre sobre un proveedor concreto, asi que `supplierId` es
 * obligatorio. El correo, el proveedor y las fechas viajan en la query string:
 * `email`, `supplierId` y `from` son obligatorios; `to` opcional.
 */
export class SendPurchasesBySupplierReportEmailQueryDto {
  @ApiProperty({
    format: 'email',
    example: 'gerencia@ejemplo.com',
    description: 'Direccion a la que se envia el reporte en PDF adjunto.',
  })
  @IsEmail({}, { message: 'email debe ser una direccion de correo valida.' })
  @MaxLength(254, { message: 'email no puede superar 254 caracteres.' })
  email!: string;

  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    description: 'Proveedor del que se listan las compras.',
  })
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId!: string;

  @ApiProperty({
    format: 'date',
    example: '2026-08-01',
    description: 'Inicio del rango, inclusive (YYYY-MM-DD).',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from debe tener el formato YYYY-MM-DD.',
  })
  from!: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-08-31',
    description:
      'Fin del rango, inclusive (YYYY-MM-DD). Si se omite, el reporte es del ' +
      'dia indicado en "from".',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to debe tener el formato YYYY-MM-DD.',
  })
  to?: string;
}
