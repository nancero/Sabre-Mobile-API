import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertSchema } from './schemas/alert.schema';
import { AuthModule } from '../auth/auth.module';
import { GeoLocationsModule } from '../geo-locations/geo-locations.module';
import { LocationSubscribeModule } from '../location-subscribe/location-subscribe.module';
import { UsersModule } from '../users/users.module';
import { NoonlightModule } from '../../utilities/noonlight/noonlight.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { NotificationModule } from '../../utilities/notification/notification.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema }]),
    forwardRef(() => LocationSubscribeModule),
    AuthModule,
    GeoLocationsModule,
    NoonlightModule,
    UsersModule,
    LoggerModule,
    NotificationModule,
    SubscriptionsModule,
  ],
  exports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema }]),
    AlertsService,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
