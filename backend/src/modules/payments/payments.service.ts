import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { CashCollection } from '../../database/entities/cash-collection.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';
import { CashbookEntryType } from '../../common/enums/cashbook-entry-type.enum';
import { Order } from '../../database/entities/order.entity';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { addMoney, toMoneyNumber, toMoneyString } from '../../common/utils/money.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CollectCodPaymentDto } from './dto/collect-cod-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(CashCollection)
    private readonly collectionsRepository: Repository<CashCollection>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async collectCod(orderId: string, dto: CollectCodPaymentDto, actor: AuthUser) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order payment already collected');
    }

    const expectedAmount = toMoneyNumber(order.totalAmount);
    if (dto.collectedAmount !== expectedAmount) {
      throw new BadRequestException('Collected amount does not match order total');
    }

    const collection = await this.dataSource.transaction(async (manager) => {
      order.paymentStatus = PaymentStatus.PAID;
      await manager.save(Order, order);

      const savedCollection = await manager.save(
        CashCollection,
        manager.create(CashCollection, {
          orderId: order.id,
          collectedById: actor.sub,
          expectedAmount: order.totalAmount,
          collectedAmount: toMoneyString(dto.collectedAmount),
          collectedAt: new Date(),
          notes: dto.notes ?? null,
        }),
      );

      const latestCashbookEntry = await manager.findOne(CashbookEntry, {
        where: {},
        order: { createdAt: 'DESC' },
      });
      const currentBalance = latestCashbookEntry
        ? toMoneyNumber(latestCashbookEntry.balance)
        : 0;

      await manager.save(
        CashbookEntry,
        manager.create(CashbookEntry, {
          date: new Date().toISOString().slice(0, 10),
          type: CashbookEntryType.CREDIT,
          description: `COD payment for ${order.orderNumber}`,
          amount: toMoneyString(dto.collectedAmount),
          balance: addMoney(currentBalance, dto.collectedAmount),
          referenceId: savedCollection.id,
          referenceType: 'CASH_COLLECTION',
        }),
      );

      return savedCollection;
    });

    this.logger.log(
      `Payment collected for ${order.orderNumber}: ${dto.collectedAmount} by ${actor.fullName}`,
    );
    this.notificationsService.emit(SocketEvent.PAYMENT_COMPLETED, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: PaymentStatus.PAID,
    });

    return collection;
  }
}
