import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoCancel() {
    this.logger.log('Running auto-cancel check...');

    // 1. Cancel unconfirmed orders (Pending for > 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const unconfirmedOrders = await this.ordersRepository.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(thirtyMinsAgo),
      },
    });

    for (const order of unconfirmedOrders) {
      order.status = OrderStatus.CANCELLED;
      await this.ordersRepository.save(order);
      this.logger.warn(`Auto-cancelled unconfirmed order: ${order.orderNumber}`);
    }

    // 2. Cancel unpaid prepaid orders (Pending for > 15 mins)
    // Note: This assumes we track if it was supposed to be prepaid. 
    // For now, let's just cancel any pending order older than 30 mins regardless.
  }
}
