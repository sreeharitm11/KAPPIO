import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { MenuItemIngredient } from './menu-item-ingredient.entity';

@Entity('ingredients')
export class Ingredient extends AppBaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  unit: string; // kg, gm, pcs, ml, l

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 0 })
  currentStock: string;

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 0 })
  lowStockThreshold: string;

  @OneToMany(() => MenuItemIngredient, (mi) => mi.ingredient)
  menuItems: MenuItemIngredient[];
}
