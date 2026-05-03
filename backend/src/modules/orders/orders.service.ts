import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
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
import { TasksService } from './tasks.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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
    private readonly tasksService: TasksService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    if (dto.idempotencyKey) {
      const existing = await this.ordersRepository.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
        relations: ['items', 'items.menuItem'],
      });
      if (existing) {
        this.logger.log(`Returning existing order for idempotency key: ${dto.idempotencyKey}`);
        return existing;
      }
    }

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

    const { subtotal, deliveryFee, totalAmount } = this.calculatePricing(dto, itemsIndex);

    if (subtotal < 150) {
      throw new BadRequestException('Minimum order value is ₹150');
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const orderNumber = await this.generateOrderNumber(manager);

      const orderEntity = manager.create(Order, {
        orderNumber,
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
        estimatedDeliveryMinutes: 15 + Math.ceil((dto.deliveryDistance || 0) * 4),
        idempotencyKey: dto.idempotencyKey ?? null,
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
      
      const fullOrder = await manager.findOneOrFail(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.menuItem'],
      });

      // Deduct stock within transaction for atomic safety
      await this.inventoryService.deductStockForOrder(fullOrder);

      return fullOrder;
    });

    // Background task for external side-effects
    this.tasksService.dispatchNotification(order);

    return order;
  }

  private calculatePricing(dto: CreateOrderDto, itemsIndex: Map<string, MenuItem>) {
    const subtotal = dto.items.reduce((sum, item) => {
      const menuItem = itemsIndex.get(item.menuItemId)!;
      return sum + toMoneyNumber(menuItem.price) * item.quantity;
    }, 0);

    let deliveryFee = 50; // default fallback
    if (dto.deliveryDistance) {
      if (dto.deliveryDistance > 12) {
        throw new BadRequestException('Outside 12km service area');
      }
      if (dto.deliveryDistance <= 3) deliveryFee = 0;
      else if (dto.deliveryDistance <= 5) deliveryFee = 20;
      else if (dto.deliveryDistance <= 8) deliveryFee = 30;
      else deliveryFee = 50;
    }

    return { subtotal, deliveryFee, totalAmount: subtotal + deliveryFee };
  }

  private async generateOrderNumber(manager: any): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await manager.createQueryBuilder(Order, 'o')
      .where('o.created_at >= :start', { start: startOfDay })
      .getCount();
    
    const sequence = (todayCount + 1).toString().padStart(4, '0');
    return `ORD-${dateStr}-${sequence}`;
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
      OrderStatus.DONE,
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
    this.tasksService.dispatchUpdate({
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }

  private async checkBlacklist(phone: string) {
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
  }
}
