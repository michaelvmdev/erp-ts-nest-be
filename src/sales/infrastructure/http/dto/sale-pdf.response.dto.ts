import { ApiProperty } from '@nestjs/swagger';
import { SalePdfOutput } from '../../../application/generate-sale-pdf.use-case';

export class SalePdfResponseDto {
  @ApiProperty({
    example: 'FAC-0000000001.pdf',
    description:
      'Nombre sugerido del archivo, derivado del numero de comprobante.',
  })
  fileName!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Tipo de contenido del archivo codificado en base64.',
  })
  mimeType!: string;

  @ApiProperty({
    example: 'JVBERi0xLjMKJ...',
    description:
      'PDF del comprobante codificado en base64. El front puede decodificarlo ' +
      'para descargarlo o mostrarlo sin una segunda peticion.',
  })
  base64!: string;

  static fromOutput(output: SalePdfOutput): SalePdfResponseDto {
    const dto = new SalePdfResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = 'application/pdf';
    dto.base64 = output.base64;
    return dto;
  }
}
