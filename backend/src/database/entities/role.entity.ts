import { Column, Entity, OneToMany } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppBaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role extends AppBaseEntity {
  @Column({ type: 'enum', enum: UserRole, unique: true })
  name: UserRole;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
