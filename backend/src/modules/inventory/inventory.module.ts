import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../../database/entities/ingredient.entity';
import { MenuItemIngredient } from '../../database/entities/menu-item-ingredient.entity';
import { InventoryLog } from '../../database/entities/inventory-log.entity';
import { Order } from '../../database/entities/order.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryCronService } from './inventory-cron.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, MenuItemIngredient, InventoryLog, Order]),
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryCronService],
  exports: [InventoryService],
})
export class InventoryModule {}
