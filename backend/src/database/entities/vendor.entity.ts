import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from './base.entity';

@Entity('vendors')
export class Vendor extends AppBaseEntity {
  @Column({ name: 'name', length: 120 })
  name: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 120, nullable: true })
  contactPerson?: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ name: 'email', type: 'varchar', length: 120, nullable: true })
  email?: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string | null;

  @Column({ name: 'gst_number', type: 'varchar', length: 50, nullable: true })
  gstNumber?: string | null;

  @Column({ name: 'fssai_number', type: 'varchar', length: 50, nullable: true })
  fssaiNumber?: string | null;

  @Column({ name: 'pan_number', type: 'varchar', length: 20, nullable: true })
  panNumber?: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 120, nullable: true })
  bankName?: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
  accountNumber?: string | null;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20, nullable: true })
  ifscCode?: string | null;

  @Column({ name: 'branch', type: 'varchar', length: 120, nullable: true })
  branch?: string | null;

  @Column({ name: 'payment_terms', type: 'text', nullable: true })
  paymentTerms?: string | null;

  @Column({ name: 'business_licenses', type: 'text', nullable: true })
  businessLicenses?: string | null;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
