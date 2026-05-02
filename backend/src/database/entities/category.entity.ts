import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { MenuItem } from './menu-item.entity';

@Entity('categories')
export class Category extends AppBaseEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  description?: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => MenuItem, (item) => item.category)
  items: MenuItem[];
}
