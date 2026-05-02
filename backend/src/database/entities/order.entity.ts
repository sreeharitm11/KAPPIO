import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { AppBaseEntity } from './base.entity';
import { CashCollection } from './cash-collection.entity';
import { DeliveryAssignment } from './delivery-assignment.entity';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order extends AppBaseEntity {
  @Column({ name: 'order_number', unique: true, length: 30 })
  orderNumber: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => User, (user) => user.customerOrders, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: User | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 120, nullable: true })
  customerName?: string | null;

  @Column({ name: 'customer_phone', length: 30 })
  customerPhone: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name: 'delivery_status',
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.ASSIGNED,
  })
  deliveryStatus: DeliveryStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions?: string | null;

  @Column({ name: 'comment_acknowledged', default: false })
  commentAcknowledged: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ name: 'delivery_fee', type: 'numeric', precision: 10, scale: 2 })
  deliveryFee: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 10, scale: 2 })
  totalAmount: string;

  @Column({ name: 'estimated_delivery_minutes', default: 30 })
  estimatedDeliveryMinutes: number;

  @Column({ name: 'assigned_by_id', type: 'uuid', nullable: true })
  assignedById?: string | null;

  @ManyToOne(() => User, (user) => user.assignedOrders, { nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => DeliveryAssignment, (assignment) => assignment.order)
  deliveryAssignment?: DeliveryAssignment;

  @OneToOne(() => CashCollection, (cashCollection) => cashCollection.order)
  cashCollection?: CashCollection;
}
