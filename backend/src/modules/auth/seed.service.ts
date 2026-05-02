import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { UserRole } from '../../common/enums/user-role.enum';

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

    // 2. Seed Admin User
    const adminEmail = 'admin@kappio.com';
    let admin = await this.usersRepository.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const adminRole = await this.rolesRepository.findOne({ where: { name: UserRole.ADMIN } });
      if (adminRole) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        admin = this.usersRepository.create({
          fullName: 'Kappio Admin',
          email: adminEmail,
          phone: '0000000000',
          passwordHash,
          role: adminRole,
          active: true,
        });
        await this.usersRepository.save(admin);
        this.logger.log('Created default admin user: admin@kappio.com / admin123');
      }
    }

    // 3. Seed Delivery Partner
    const deliveryEmail = 'delivery@kappio.com';
    let delivery = await this.usersRepository.findOne({ where: { email: deliveryEmail } });
    if (!delivery) {
      const deliveryRole = await this.rolesRepository.findOne({ where: { name: UserRole.DELIVERY } });
      if (deliveryRole) {
        const passwordHash = await bcrypt.hash('delivery123', 10);
        delivery = this.usersRepository.create({
          fullName: 'Main Delivery Partner',
          email: deliveryEmail,
          phone: '917012206714',
          passwordHash,
          role: deliveryRole,
          active: true,
        });
        await this.usersRepository.save(delivery);
        this.logger.log('Created default delivery user: delivery@kappio.com / delivery123');
      }
    }
  }
}
