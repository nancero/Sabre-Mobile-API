import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TrustedContactModule } from '../trusted-contacts/trusted-contacts.module';
import { LocationSubscribeService } from './location-subscribe.service';
import { LocationSubscribeGateway } from './location-subscribe.gateway';
import { UsersModule } from '../users/users.module';
import { GeoLocationsModule } from '../geo-locations/geo-locations.module';
import { AlertsModule } from '../alerts/alerts.module';
import { TwilioModule } from '../../utilities/twilio';
// import { NotificationModule } from '../../utilities/notification/notification.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { URLShortenerModule } from '../../utilities/url-shortener/url-shortener.module';
import { NoonlightModule } from '../../utilities/noonlight/noonlight.module';

@Module({
  imports: [
    forwardRef(() => AlertsModule),
    LoggerModule,
    UsersModule,
    forwardRef(() => GeoLocationsModule),
    TrustedContactModule,
    TwilioModule,
    // NotificationModule,
    LoggerModule,
    URLShortenerModule,
    ConfigModule,
    NoonlightModule,
  ],
  providers: [LocationSubscribeGateway, LocationSubscribeService],
  exports: [LocationSubscribeService],
})
export class LocationSubscribeModule {}
