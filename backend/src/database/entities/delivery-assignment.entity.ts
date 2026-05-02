import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { AppBaseEntity } from './base.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('delivery_assignments')
export class DeliveryAssignment extends AppBaseEntity {
  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.deliveryAssignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @ManyToOne(() => User, (user) => user.deliveryAssignments)
  @JoinColumn({ name: 'partner_id' })
  partner: User;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.ASSIGNED,
  })
  status: DeliveryStatus;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt?: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;
}
