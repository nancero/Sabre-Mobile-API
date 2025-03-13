import { Injectable } from '@nestjs/common';
import { LoggerService } from 'nest-logger';

import { AlertsService } from '../alerts/alerts.service';
import { NotificationService } from '../../utilities/notification/notification.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly loggerService: LoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  async cancelAlertByNoonlight(
    alarmId: string,
    canceledBy: string,
    alarmStatus: string,
  ): Promise<void> {
    try {
      const alert = await this.alertsService.cancelAlertByNoonlight(
        alarmId,
        canceledBy,
        alarmStatus,
      );
      this.notificationService.pushNotificationToUsers(
        [alert.createdBy],
        'Your alert was cancelled',
        'Your alert was cancelled by Noonlight',
      );
    } catch (err) {
      this.loggerService.error(
        err.message,
        'alertService',
        `${IntegrationsService.name} -> listenEvent`,
      );
    }
  }
}
