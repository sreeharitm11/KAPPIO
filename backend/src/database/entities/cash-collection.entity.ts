import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('cash_collection')
export class CashCollection extends AppBaseEntity {
  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.cashCollection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'collected_by_id' })
  collectedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'collected_by_id' })
  collectedBy: User;

  @Column({ name: 'expected_amount', type: 'numeric', precision: 10, scale: 2 })
  expectedAmount: string;

  @Column({ name: 'collected_amount', type: 'numeric', precision: 10, scale: 2 })
  collectedAmount: string;

  @Column({ name: 'collected_at', type: 'timestamptz' })
  collectedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
