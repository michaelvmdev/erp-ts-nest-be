import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalEntry } from '../../../domain/journal-entry';
import { JournalEntrySummary } from '../../../domain/journal.repository';

export class JournalLineResponseDto {
  @ApiProperty() lineNumber!: number;
  @ApiProperty() accountCode!: string;
  @ApiProperty() accountName!: string;
  @ApiProperty() debit!: string;
  @ApiProperty() credit!: string;
}

export class JournalEntrySummaryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() entryNumber!: string;
  @ApiProperty() entryDate!: string;
  @ApiProperty() description!: string;
  @ApiProperty() referenceType!: string;
  @ApiPropertyOptional() referenceId!: string | null;
  @ApiProperty() totalDebit!: string;
  @ApiProperty() lineCount!: number;

  static fromSummary(s: JournalEntrySummary): JournalEntrySummaryResponseDto {
    return Object.assign(new JournalEntrySummaryResponseDto(), s);
  }
}

export class JournalEntryDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() entryNumber!: string;
  @ApiProperty() entryDate!: string;
  @ApiProperty() description!: string;
  @ApiProperty() referenceType!: string;
  @ApiPropertyOptional() referenceId!: string | null;
  @ApiProperty() totalDebit!: string;
  @ApiProperty() totalCredit!: string;
  @ApiProperty({ type: [JournalLineResponseDto] }) lines!: JournalLineResponseDto[];

  static fromDomain(e: JournalEntry): JournalEntryDetailResponseDto {
    const dto = new JournalEntryDetailResponseDto();
    dto.id            = e.id.value;
    dto.entryNumber   = e.entryNumber;
    dto.entryDate     = e.entryDate;
    dto.description   = e.description;
    dto.referenceType = e.referenceType;
    dto.referenceId   = e.referenceId;
    dto.totalDebit    = (e.totalDebit.centimos / 100).toFixed(2);
    dto.totalCredit   = (e.totalCredit.centimos / 100).toFixed(2);
    dto.lines         = e.lines.map((l) => {
      const ld = new JournalLineResponseDto();
      ld.lineNumber  = l.lineNumber;
      ld.accountCode = l.accountCode;
      ld.accountName = l.accountName;
      ld.debit       = (l.debit.centimos / 100).toFixed(2);
      ld.credit      = (l.credit.centimos / 100).toFixed(2);
      return ld;
    });
    return dto;
  }
}
