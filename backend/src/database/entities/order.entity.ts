import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { AppBaseEntity } from './base.entity';
import { CashCollection } from './cash-collection.entity';
import { DeliveryAssignment } from './delivery-assignment.entity';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';

@Entity('orders')
@Index(['status', 'createdAt'])
export class Order extends AppBaseEntity {
  @Column({ name: 'order_number', type: 'varchar', unique: true, length: 30 })
  orderNumber: string;

  @Index()
  @Column({ name: 'idempotency_key', type: 'varchar', unique: true, nullable: true })
  idempotencyKey?: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => User, (user) => user.customerOrders, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: User | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 120, nullable: true })
  customerName?: string | null;

  @Index()
  @Column({ name: 'customer_phone', type: 'varchar', length: 30 })
  customerPhone: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'table_number', type: 'varchar', length: 20, nullable: true })
  tableNumber?: string | null;

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

  @Column({ name: 'comment_acknowledged', type: 'boolean', default: false })
  commentAcknowledged: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ name: 'delivery_fee', type: 'numeric', precision: 10, scale: 2 })
  deliveryFee: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 10, scale: 2 })
  totalAmount: string;

  @Column({ name: 'estimated_delivery_minutes', type: 'integer', default: 30 })
  estimatedDeliveryMinutes: number;

  @Column({ name: 'assigned_by_id', type: 'uuid', nullable: true })
  assignedById?: string | null;

  @ManyToOne(() => User, (user) => user.assignedOrders, { nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude?: string | null;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude?: string | null;

  @Column({ name: 'delivery_distance', type: 'numeric', precision: 5, scale: 2, nullable: true })
  deliveryDistance?: string | null;

  @OneToOne(() => DeliveryAssignment, (assignment) => assignment.order)
  deliveryAssignment?: DeliveryAssignment;

  @OneToOne(() => CashCollection, (cashCollection) => cashCollection.order)
  cashCollection?: CashCollection;
}
