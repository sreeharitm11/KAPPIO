import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../../database/entities/expense.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Order } from '../../database/entities/order.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Expense, OrderItem, CashbookEntry])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
