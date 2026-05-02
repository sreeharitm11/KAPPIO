import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { DeliveryAssignment } from './delivery-assignment.entity';
import { Expense } from './expense.entity';
import { Order } from './order.entity';
import { Role } from './role.entity';

@Entity('users')
export class User extends AppBaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  phone: string;

  /** Null until invite is accepted or legacy rows remain hashed */
  @Column('varchar', { name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column('varchar', {
    name: 'invite_token',
    length: 64,
    nullable: true,
    unique: true,
  })
  inviteToken: string | null;

  @Column('timestamptz', { name: 'invite_expires_at', nullable: true })
  inviteExpiresAt: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Order, (order) => order.customer)
  customerOrders: Order[];

  @OneToMany(() => Order, (order) => order.assignedBy)
  assignedOrders: Order[];

  @OneToMany(() => DeliveryAssignment, (assignment) => assignment.partner)
  deliveryAssignments: DeliveryAssignment[];

  @OneToMany(() => Expense, (expense) => expense.createdBy)
  createdExpenses: Expense[];
}
