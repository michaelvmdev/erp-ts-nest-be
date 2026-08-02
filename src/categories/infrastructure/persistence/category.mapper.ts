import { Category } from '../../domain/category';
import { CategoryDescription } from '../../domain/value-objects/category-description.value-object';
import { CategoryId } from '../../domain/value-objects/category-id.value-object';
import { CategoryOrmEntity } from './category.orm-entity';

export class CategoryMapper {
  static toDomain(row: CategoryOrmEntity): Category {
    return Category.rehydrate({
      id: CategoryId.of(row.categoryId),
      description: CategoryDescription.of(row.categoryDescription),
      active: row.categoryActive,
    });
  }

  static toPersistence(category: Category): CategoryOrmEntity {
    const snapshot = category.toSnapshot();

    const row = new CategoryOrmEntity();
    row.categoryId = snapshot.id;
    row.categoryDescription = snapshot.description;
    row.categoryActive = snapshot.active;
    return row;
  }
}
