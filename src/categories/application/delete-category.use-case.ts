import { Inject, Injectable } from '@nestjs/common';
import { CategoryNotFoundError } from '../domain/category.errors';
import { CATEGORY_REPOSITORY } from '../domain/category.repository';
import type { CategoryRepository } from '../domain/category.repository';
import { CategoryId } from '../domain/value-objects/category-id.value-object';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(rawCategoryId: string): Promise<void> {
    const id = CategoryId.of(rawCategoryId);

    // Se consulta antes de borrar para distinguir 404 ("no existe") de 204
    // ("existia y se borro"). Sin esta lectura, un DELETE sobre un id inexistente
    // devolveria 204 y el cliente creeria que borro algo.
    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id.value);
    }

    // Si algun producto referencia la categoria, el adaptador traduce la
    // violacion de clave foranea a CategoryInUseError y el filtro responde 409.
    await this.categories.delete(id);
  }
}
