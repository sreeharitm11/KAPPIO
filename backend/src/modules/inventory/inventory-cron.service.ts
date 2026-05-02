import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { InventoryLog, InventoryLogType } from '../../database/entities/inventory-log.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryCronService {
  private readonly logger = new Logger(InventoryCronService.name);

  constructor(
    @InjectRepository(InventoryLog)
    private readonly logRepo: Repository<InventoryLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Run every night at 10 PM
   */
  @Cron('0 22 * * *')
  async checkEndOfDayManualUpdate() {
    this.logger.log('Checking for EOD manual inventory updates...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const manualLogsToday = await this.logRepo.count({
      where: {
        type: InventoryLogType.MANUAL_ADJUSTMENT,
        createdAt: MoreThan(today),
      },
    });

    if (manualLogsToday === 0) {
      this.logger.warn('No manual inventory updates found today! Sending alert.');
      await this.notificationsService.sendSystemAlert(
        'Inventory Reminder',
        'You haven\'t updated your physical stock levels today. Please perform a manual count before closing.'
      );
    }
  }

  /**
   * Run every morning at 8 AM as a reminder if still not done
   */
  @Cron('0 8 * * *')
  async morningReminder() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const manualLogsYesterday = await this.logRepo.count({
      where: {
        type: InventoryLogType.MANUAL_ADJUSTMENT,
        createdAt: MoreThan(yesterday),
      },
    });

    if (manualLogsYesterday === 0) {
      await this.notificationsService.sendSystemAlert(
        'Critical Inventory Alert',
        'Manual stock count was missed yesterday. Please update current levels immediately.'
      );
    }
  }
}
