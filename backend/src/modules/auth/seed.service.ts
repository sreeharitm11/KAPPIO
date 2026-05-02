import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/** System users that are always present and always have known credentials */
const SEED_USERS = [
  {
    fullName: 'Kappio Admin',
    email: 'admin@kappio.com',
    phone: '0000000001',
    password: 'admin123',
    role: UserRole.ADMIN,
  },
  {
    fullName: 'Main Delivery Partner',
    email: 'delivery@kappio.com',
    phone: '917012206714',
    password: 'delivery123',
    role: UserRole.DELIVERY,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting database seeding...');

    // 1. Seed Roles
    const roles = Object.values(UserRole);
    for (const roleName of roles) {
      let role = await this.rolesRepository.findOne({ where: { name: roleName as any } });
      if (!role) {
        role = this.rolesRepository.create({ name: roleName as any });
        await this.rolesRepository.save(role);
        this.logger.log(`Created role: ${roleName}`);
      }
    }

    // 2. Seed / Refresh System Users
    // Always updates the password hash so credentials never drift from the values below.
    for (const seed of SEED_USERS) {
      const seedRole = await this.rolesRepository.findOne({ where: { name: seed.role as any } });
      if (!seedRole) continue;

      const passwordHash = await bcrypt.hash(seed.password, 10);
      let user = await this.usersRepository.findOne({ where: { email: seed.email } });

      if (!user) {
        user = this.usersRepository.create({
          fullName: seed.fullName,
          email: seed.email,
          phone: seed.phone,
          passwordHash,
          role: seedRole,
          roleId: seedRole.id,
          active: true,
        });
        await this.usersRepository.save(user);
        this.logger.log(`✅ Created  ${seed.email}  /  ${seed.password}`);
      } else {
        // Refresh password so it always matches the seed definition
        user.passwordHash = passwordHash;
        user.active = true;
        user.fullName = seed.fullName;
        await this.usersRepository.save(user);
        this.logger.log(`🔄 Refreshed ${seed.email}  /  ${seed.password}`);
      }
    }

    this.logger.log('Seeding complete.');
  }
}
