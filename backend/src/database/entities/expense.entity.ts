import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ExpenseType } from '../../common/enums/expense-type.enum';
import { AppBaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('expenses')
export class Expense extends AppBaseEntity {
  @Column({ type: 'date' })
  date: string;

  @Column({ length: 180 })
  description: string;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'enum', enum: ExpenseType })
  type: ExpenseType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, (user) => user.createdExpenses, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;
}
