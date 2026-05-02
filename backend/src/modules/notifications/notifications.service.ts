import { Injectable, Logger } from '@nestjs/common';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly gateway: NotificationsGateway) {}

  emit(event: SocketEvent, payload: unknown) {
    this.gateway.emit(event, payload);
  }

  async sendWhatsappNotification(phone: string, message: string) {
    this.logger.log(`Mock WhatsApp notification sent to ${phone}: ${message}`);
    return { phone, message, sent: true, provider: 'mock' };
  }

  async sendSystemAlert(title: string, message: string) {
    this.logger.warn(`SYSTEM ALERT: ${title} - ${message}`);
    this.emit(SocketEvent.SYSTEM_ALERT, { title, message });
  }
}
