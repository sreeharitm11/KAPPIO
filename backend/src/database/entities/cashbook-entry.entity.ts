import { Column, Entity } from 'typeorm';
import { CashbookEntryType } from '../../common/enums/cashbook-entry-type.enum';
import { AppBaseEntity } from './base.entity';

@Entity('cashbook')
export class CashbookEntry extends AppBaseEntity {
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: CashbookEntryType })
  type: CashbookEntryType;

  @Column({ length: 180 })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  balance: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 60, nullable: true })
  referenceType?: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string | null;
}
