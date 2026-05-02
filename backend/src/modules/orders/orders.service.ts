import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { MenuItem } from '../../database/entities/menu-item.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Order } from '../../database/entities/order.entity';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { toMoneyNumber, toMoneyString } from '../../common/utils/money.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly deliveryFee = 40;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const menuItems = await this.menuItemsRepository.findBy({
      id: In(dto.items.map((item) => item.menuItemId)),
    });

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('One or more menu items are invalid');
    }

    const itemsIndex = new Map(menuItems.map((item) => [item.id, item]));
    const unavailable = dto.items.find((item) => !itemsIndex.get(item.menuItemId)?.available);
    if (unavailable) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const subtotal = dto.items.reduce((sum, item) => {
        const menuItem = itemsIndex.get(item.menuItemId)!;
        return sum + toMoneyNumber(menuItem.price) * item.quantity;
      }, 0);
      const totalAmount = subtotal + this.deliveryFee;

      const orderEntity = manager.create(Order, {
        orderNumber: `KAP-${Date.now().toString().slice(-8)}`,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        specialInstructions: dto.specialInstructions ?? null,
        subtotal: toMoneyString(subtotal),
        deliveryFee: toMoneyString(this.deliveryFee),
        totalAmount: toMoneyString(totalAmount),
      });

      const savedOrder = await manager.save(Order, orderEntity);

      const orderItems = dto.items.map((item) => {
        const menuItem = itemsIndex.get(item.menuItemId)!;
        const unitPrice = toMoneyNumber(menuItem.price);

        return manager.create(OrderItem, {
          orderId: savedOrder.id,
          menuItemId: menuItem.id,
          quantity: item.quantity,
          unitPrice: toMoneyString(unitPrice),
          lineTotal: toMoneyString(unitPrice * item.quantity),
        });
      });

      await manager.save(OrderItem, orderItems);
      return manager.findOneOrFail(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.menuItem'],
      });
    });

    this.logger.log(`Order created: ${order.orderNumber}`);
    this.notificationsService.emit(SocketEvent.NEW_ORDER, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
    });
    await this.notificationsService.sendWhatsappNotification(
      order.customerPhone,
      `Order ${order.orderNumber} created successfully. Total: INR ${order.totalAmount}.`,
    );

    return order;
  }

  async findAll(query: ListOrdersQueryDto): Promise<PaginatedResponse<Order>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.customerPhone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('order.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyOrders(
    customerId: string,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('order.customerId = :customerId', { customerId });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.menuItem', 'deliveryAssignment', 'cashCollection'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async trackByOrderNumber(orderNumber: string) {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.menuItem', 'deliveryAssignment'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async acknowledgeSpecialInstructions(id: string) {
    const order = await this.findOne(id);
    order.commentAcknowledged = true;
    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actor?: AuthUser) {
    const order = await this.findOne(id);
    const currentStatusFlow = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.DELIVERED,
    ];
    const currentIndex = currentStatusFlow.indexOf(order.status);
    const nextIndex = currentStatusFlow.indexOf(dto.status);

    if (nextIndex < currentIndex) {
      throw new BadRequestException('Order status cannot move backward');
    }

    order.status = dto.status;
    const updatedOrder = await this.ordersRepository.save(order);

    this.logger.log(
      `Order updated: ${order.orderNumber} -> ${dto.status} by ${actor?.fullName ?? 'system'}`,
    );
    this.notificationsService.emit(SocketEvent.ORDER_UPDATED, {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }
}
