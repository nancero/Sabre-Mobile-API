import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeoLocationsController } from './geo-locations.controller';
import { GeoLocationsService } from './geo-locations.service';
import { GeoLocationSchema } from './schemas/geo-location.schema';
import { AuthModule } from '../auth/auth.module';
import { NoonlightModule } from '../../utilities/noonlight/noonlight.module';
import { AlertsModule } from '../alerts/alerts.module';
import { LocationSubscribeModule } from '../location-subscribe/location-subscribe.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'GeoLocation', schema: GeoLocationSchema },
    ]),
    forwardRef(() => AlertsModule), // Keep only this reference for AlertsModule
    AuthModule,
    NoonlightModule,
    LocationSubscribeModule,
  ],
  controllers: [GeoLocationsController],
  providers: [GeoLocationsService],
  exports: [GeoLocationsService],
})
export class GeoLocationsModule {}
