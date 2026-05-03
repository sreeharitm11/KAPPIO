import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { SocketEvent } from '../../common/enums/socket-event.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Dispatches a notification task to the background.
   * In production, this should be replaced with a real Queue (e.g., BullMQ).
   */
  async dispatchNotification(order: any) {
    // Non-blocking execution
    setImmediate(async () => {
      try {
        this.logger.log(`Background: Processing notifications for order ${order.orderNumber}`);
        
        // 1. Socket Emit
        this.notificationsService.emit(SocketEvent.NEW_ORDER, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
        });

        // 2. WhatsApp
        await this.notificationsService.sendWhatsappNotification(
          order.customerPhone,
          `Order ${order.orderNumber} created successfully. Total: INR ${order.totalAmount}.`,
        );

        this.logger.log(`Background: Notifications sent for order ${order.orderNumber}`);
      } catch (err) {
        this.logger.error(`Background: Failed to send notifications for order ${order.orderNumber}`, err);
      }
    });
  }

  /**
   * Dispatches a status update notification to the background.
   */
  async dispatchUpdate(data: { orderId: string; orderNumber: string; status: string }) {
    setImmediate(() => {
      try {
        this.notificationsService.emit(SocketEvent.ORDER_UPDATED, data);
      } catch (err) {
        this.logger.error(`Background: Failed to emit status update for ${data.orderNumber}`, err);
      }
    });
  }
}
