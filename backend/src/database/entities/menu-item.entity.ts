import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';

@Entity('menu_items')
export class MenuItem extends AppBaseEntity {
  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.items, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ default: true })
  available: boolean;

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @OneToMany(() => OrderItem, (item) => item.menuItem)
  orderItems: OrderItem[];
}
