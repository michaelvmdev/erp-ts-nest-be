import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Estado de la comprobacion.' })
  status!: string;

  @ApiProperty({
    type: 'integer',
    example: 12,
    description: 'Milisegundos que tardo la consulta de comprobacion.',
  })
  latencyMs!: number;
}
