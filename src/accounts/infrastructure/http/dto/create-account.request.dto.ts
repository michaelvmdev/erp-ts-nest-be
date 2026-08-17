import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { AccountType } from '../../../domain/account';

export class CreateAccountRequestDto {
  @ApiProperty({ example: '1011', maxLength: 10 })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code!: string;

  @ApiProperty({ example: 'Caja', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ enum: ['activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'orden'] })
  @IsEnum(['activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'orden'])
  type!: AccountType;

  @ApiPropertyOptional({ example: '10', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  parentCode?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
