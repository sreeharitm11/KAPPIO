import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { DeliveryAssignment } from '../../database/entities/delivery-assignment.entity';
import { Order } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';
import { AuthUser } from '../../shared/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryAssignment)
    private readonly assignmentsRepository: Repository<DeliveryAssignment>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async assign(orderId: string, dto: AssignDeliveryDto, actor?: AuthUser) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const partner = await this.usersRepository.findOne({
      where: { id: dto.partnerId },
      relations: ['role'],
    });
    if (!partner || partner.role.name !== UserRole.DELIVERY) {
      throw new NotFoundException('Delivery partner not found');
    }

    const existing = await this.assignmentsRepository.findOne({ where: { orderId } });
    const assignment = existing ?? this.assignmentsRepository.create({ orderId });
    assignment.partnerId = partner.id;
    assignment.status = DeliveryStatus.ASSIGNED;

    order.assignedById = actor?.sub ?? null;
    order.deliveryStatus = DeliveryStatus.ASSIGNED;
    await this.ordersRepository.save(order);

    const saved = await this.assignmentsRepository.save(assignment);
    this.logger.log(`Delivery assigned for order ${order.orderNumber} to ${partner.fullName}`);
    return saved;
  }

  async findAssignedOrders(partnerId: string) {
    return this.assignmentsRepository.find({
      where: { partnerId },
      relations: ['order', 'order.items', 'order.items.menuItem', 'partner'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateStatus(orderId: string, dto: UpdateDeliveryStatusDto, actor: AuthUser) {
    const assignment = await this.assignmentsRepository.findOne({
      where: { orderId },
      relations: ['order', 'partner'],
    });
    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    assignment.status = dto.status;
    assignment.pickedUpAt =
      dto.status === DeliveryStatus.PICKED_UP ? new Date() : assignment.pickedUpAt;
    assignment.deliveredAt =
      dto.status === DeliveryStatus.DELIVERED ? new Date() : assignment.deliveredAt;
    assignment.order.deliveryStatus = dto.status;
    if (dto.status === DeliveryStatus.DELIVERED) {
      assignment.order.status = OrderStatus.DELIVERED;
    }

    await this.ordersRepository.save(assignment.order);
    const saved = await this.assignmentsRepository.save(assignment);

    this.logger.log(
      `Delivery status updated for order ${assignment.order.orderNumber} -> ${dto.status} by ${actor.fullName}`,
    );
    this.notificationsService.emit(SocketEvent.ORDER_UPDATED, {
      orderId: assignment.order.id,
      orderNumber: assignment.order.orderNumber,
      deliveryStatus: dto.status,
    });

    return saved;
  }
}
