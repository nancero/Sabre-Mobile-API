import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { LoggerModule } from '../../common/logger/logger.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationModule } from '../../utilities/notification/notification.module';

@Module({
  imports: [LoggerModule, AlertsModule, NotificationModule],
  providers: [IntegrationsService],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
