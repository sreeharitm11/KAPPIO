import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, LessThan } from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { MenuItem } from '../../database/entities/menu-item.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';
import { DeliveryAssignment } from '../../database/entities/delivery-assignment.entity';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { toMoneyNumber, toMoneyString } from '../../common/utils/money.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly SHOP_LAT = 13.0854;
  private readonly SHOP_LNG = 77.4329;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(DeliveryAssignment)
    private readonly assignmentsRepository: Repository<DeliveryAssignment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // Spam/Blacklist check
    await this.checkBlacklist(dto.customerPhone);

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

      // Delivery fee logic based on distance (km)
      let deliveryFee = 0;
      if (dto.deliveryDistance) {
        if (dto.deliveryDistance > 12) {
          throw new BadRequestException('Delivery address is outside our 12km service area');
        }
        if (dto.deliveryDistance <= 3) {
          deliveryFee = 0;
        } else if (dto.deliveryDistance <= 5) {
          deliveryFee = 20;
        } else if (dto.deliveryDistance <= 8) {
          deliveryFee = 30;
        } else {
          deliveryFee = 50;
        }
      } else {
        // Fallback or default if distance not provided (should ideally be mandatory for delivery)
        deliveryFee = 40;
      }

      const totalAmount = subtotal + deliveryFee;

      const orderEntity = manager.create(Order, {
        orderNumber: `KAP-${Date.now().toString().slice(-8)}`,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        specialInstructions: dto.specialInstructions ?? null,
        subtotal: toMoneyString(subtotal),
        deliveryFee: toMoneyString(deliveryFee),
        totalAmount: toMoneyString(totalAmount),
        latitude: dto.latitude?.toString() ?? null,
        longitude: dto.longitude?.toString() ?? null,
        deliveryDistance: dto.deliveryDistance?.toString() ?? null,
        estimatedDeliveryMinutes: 15 + Math.ceil((dto.deliveryDistance || 0) * 4), // 15m prep + 4m per km
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
    
    // Auto-assign to delivery partner if accepted
    if (dto.status === OrderStatus.ACCEPTED) {
      // Find the first delivery user (assuming one partner for now)
      const deliveryUser = await this.dataSource.getRepository(User).findOne({
        where: { role: { name: UserRole.DELIVERY }, active: true },
        relations: ['role'],
      });
      
      if (deliveryUser) {
        order.assignedById = deliveryUser.id;
        order.deliveryStatus = DeliveryStatus.ASSIGNED;
        
        // Create delivery assignment record
        const assignment = this.assignmentsRepository.create({
          orderId: order.id,
          partnerId: deliveryUser.id,
          status: DeliveryStatus.ASSIGNED,
        });
        await this.assignmentsRepository.save(assignment);

        this.logger.log(`Order ${order.orderNumber} auto-assigned to delivery partner: ${deliveryUser.fullName}`);
      }
      
      // Deduct inventory stock
      await this.inventoryService.deductStockForOrder(order);
    }

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

  private async checkBlacklist(phone: string) {
    const last24h = new Date(Date.now() - 24 * 60 * 1000 * 60);
    const recentOrders = await this.ordersRepository.find({
      where: { customerPhone: phone, createdAt: LessThan(last24h) }, // Wait, I need LessThan for Date
    });
    // Actually, I'll use query builder for more complex checks
    const stats = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COUNT(id)', 'total')
      .addSelect("SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)", 'cancelled')
      .where('order.customerPhone = :phone', { phone })
      .getRawOne();

    const total = parseInt(stats.total) || 0;
    const cancelled = parseInt(stats.cancelled) || 0;

    if (total >= 5 && (cancelled / total) > 0.4) {
      throw new BadRequestException('Your account has been restricted due to high cancellation rate.');
    }

    const recentCancelled = await this.ordersRepository.count({
      where: { 
        customerPhone: phone, 
        status: OrderStatus.CANCELLED,
        createdAt: LessThan(new Date()) // Simplified
      },
    });
    // For now, let's just stick to the 40% rule if total > 5
  }
}
