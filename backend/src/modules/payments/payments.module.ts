import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashCollection } from '../../database/entities/cash-collection.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
import { Order } from '../../database/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, CashCollection, CashbookEntry]),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
