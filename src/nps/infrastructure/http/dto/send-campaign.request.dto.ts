import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class SendCampaignRequestDto {
  @ApiProperty({ enum: ['promoter', 'passive', 'detractor'], example: 'promoter' })
  @IsIn(['promoter', 'passive', 'detractor'])
  segment!: 'promoter' | 'passive' | 'detractor';

  @ApiProperty({ example: 'Gracias por recomendarnos — descuento exclusivo para ti' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject!: string;
}
