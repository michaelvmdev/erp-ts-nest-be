import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class TransferStockRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Producto a transferir.' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ format: 'uuid', description: 'Almacen de origen.' })
  @IsUUID('4')
  sourceWarehouseId!: string;

  @ApiProperty({ format: 'uuid', description: 'Almacen de destino.' })
  @IsUUID('4')
  destinationWarehouseId!: string;

  @ApiProperty({ type: 'integer', minimum: 1, description: 'Cantidad de unidades a transferir.' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ maxLength: 250, description: 'Nota o motivo de la transferencia.' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  notes?: string;
}
