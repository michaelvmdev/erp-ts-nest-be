import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Account } from '../../../../accounts/domain/account';

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty({ example: '1011', description: 'Codigo PCGE de la cuenta.' })
  code!: string;

  @ApiProperty({ example: 'Caja' })
  name!: string;

  @ApiProperty({
    enum: ['activo', 'pasivo', 'patrimonio', 'ingresos', 'gastos', 'orden'],
    example: 'activo',
  })
  type!: string;

  @ApiPropertyOptional({ example: '10', nullable: true })
  parentCode!: string | null;

  @ApiProperty({ example: true })
  active!: boolean;

  static fromDomain(account: Account): AccountResponseDto {
    const s = account.toSnapshot();
    const dto = new AccountResponseDto();
    dto.accountId = s.id;
    dto.code = s.code;
    dto.name = s.name;
    dto.type = s.type;
    dto.parentCode = s.parentCode;
    dto.active = s.active;
    return dto;
  }
}
