import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSaleTypesUseCase } from '../../application/list-sale-types.use-case';
import { SaleTypeResponseDto } from './dto/sale-type.response.dto';

@ApiTags('sale-types')
@Controller('sale-types')
export class SaleTypesController {
  constructor(private readonly listSaleTypes: ListSaleTypesUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los tipos de comprobante',
    description:
      'Devuelve el catalogo completo ordenado por identificador: primero factura, despues ' +
      'boleta.\n\n' +
      'La respuesta es un arreglo plano, sin envoltorio de paginado: el catalogo es fijo y ' +
      'de dos elementos, asi que un `meta` que nunca cambia solo agregaria ruido.\n\n' +
      'El `saleTypeCode` es el prefijo con el que se numeran las ventas de ese tipo, y el ' +
      '`saleTypeId` es el valor que se envia al registrar una venta.\n\n' +
      'No se incluye el ultimo numero emitido de cada serie: es un dato interno de ' +
      'facturacion, no informacion del catalogo, y revelaria el volumen de operaciones a ' +
      'cualquiera que consulte la API.',
  })
  @ApiOkResponse({
    description: 'Catalogo de tipos de comprobante.',
    type: [SaleTypeResponseDto],
  })
  async findAll(): Promise<SaleTypeResponseDto[]> {
    const saleTypes = await this.listSaleTypes.execute();
    return saleTypes.map((s) => SaleTypeResponseDto.fromDomain(s));
  }
}
