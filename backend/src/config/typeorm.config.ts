import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CashCollection } from '../database/entities/cash-collection.entity';
import { CashbookEntry } from '../database/entities/cashbook-entry.entity';
import { Category } from '../database/entities/category.entity';
import { DeliveryAssignment } from '../database/entities/delivery-assignment.entity';
import { Expense } from '../database/entities/expense.entity';
import { MenuItem } from '../database/entities/menu-item.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Order } from '../database/entities/order.entity';
import { Role } from '../database/entities/role.entity';
import { Otp } from '../database/entities/otp.entity';
import { User } from '../database/entities/user.entity';
import { Vendor } from '../database/entities/vendor.entity';
import { Ingredient } from '../database/entities/ingredient.entity';
import { MenuItemIngredient } from '../database/entities/menu-item-ingredient.entity';
import { InventoryLog } from '../database/entities/inventory-log.entity';

export const dataSourceOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  autoLoadEntities: false,
  synchronize: true,
  logging: false,
  entities: [
    Role,
    User,
    Category,
    MenuItem,
    Order,
    OrderItem,
    DeliveryAssignment,
    CashCollection,
    CashbookEntry,
    Expense,
    Vendor,
    Otp,
    Ingredient,
    MenuItemIngredient,
    InventoryLog,
  ],
});
