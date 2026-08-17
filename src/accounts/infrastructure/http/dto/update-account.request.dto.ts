import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { AccountType } from '../../../domain/account';

export class UpdateAccountRequestDto {
  @ApiPropertyOptional({ example: '1011', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ example: 'Caja', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: ['activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'orden'] })
  @IsOptional()
  @IsEnum(['activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'orden'])
  type?: AccountType;

  @ApiPropertyOptional({ example: '10', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  parentCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
