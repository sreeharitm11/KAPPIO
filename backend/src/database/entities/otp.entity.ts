import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from './base.entity';

@Entity('otps')
export class Otp extends AppBaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 160 })
  @Index()
  email: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 72 })
  codeHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ name: 'last_sent_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastSentAt: Date;
}
