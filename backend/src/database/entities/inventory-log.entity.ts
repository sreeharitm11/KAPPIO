import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Ingredient } from './ingredient.entity';

export enum InventoryLogType {
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  AUTO_DEDUCTION = 'AUTO_DEDUCTION',
  PURCHASE = 'PURCHASE',
}

@Entity('inventory_logs')
export class InventoryLog extends AppBaseEntity {
  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  changeAmount: string;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  balanceAfter: string;

  @Column({
    type: 'enum',
    enum: InventoryLogType,
  })
  type: InventoryLogType;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;
}
