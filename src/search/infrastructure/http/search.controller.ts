import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @MinLength(2)
  q!: string;
}

export interface SearchResult {
  type: 'product' | 'client' | 'supplier' | 'user_ecommerce';
  id: string;
  label: string;
  detail: string;
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Búsqueda global' })
  @ApiQuery({ name: 'q', description: 'Texto a buscar (mín 2 caracteres)' })
  @ApiOkResponse({ description: 'Resultados agrupados por entidad.' })
  async search(@Query('q') q: string): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];
    const term = `%${q.trim()}%`;

    const [products, clients, suppliers, users] = await Promise.all([
      this.ds.query<SearchResult[]>(
        `SELECT 'product' AS type, product_id::text AS id,
                product_name AS label, COALESCE(product_description, '') AS detail
         FROM products
         WHERE product_active = true
           AND (product_name ILIKE $1 OR product_description ILIKE $1)
         ORDER BY product_name LIMIT 10`,
        [term],
      ),
      this.ds.query<SearchResult[]>(
        `SELECT 'client' AS type, client_id::text AS id,
                client_description AS label, document_number AS detail
         FROM clients
         WHERE client_active = true
           AND (client_description ILIKE $1 OR document_number ILIKE $1)
         ORDER BY client_description LIMIT 10`,
        [term],
      ),
      this.ds.query<SearchResult[]>(
        `SELECT 'supplier' AS type, supplier_id::text AS id,
                supplier_description AS label, COALESCE(supplier_ruc, '') AS detail
         FROM suppliers
         WHERE supplier_active = true
           AND (supplier_description ILIKE $1 OR supplier_ruc ILIKE $1)
         ORDER BY supplier_description LIMIT 10`,
        [term],
      ),
      this.ds.query<SearchResult[]>(
        `SELECT 'user_ecommerce' AS type, user_ecommerce_id::text AS id,
                (first_name || ' ' || last_name) AS label, email AS detail
         FROM users_ecommerce
         WHERE user_active = true
           AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
         ORDER BY last_name LIMIT 10`,
        [term],
      ),
    ]);

    return [...products, ...clients, ...suppliers, ...users];
  }
}
