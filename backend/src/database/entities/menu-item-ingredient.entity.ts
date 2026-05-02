import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Ingredient } from './ingredient.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_item_ingredients')
export class MenuItemIngredient extends AppBaseEntity {
  @Column({ name: 'menu_item_id', type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;

  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.menuItems)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  quantityNeeded: string;
}
