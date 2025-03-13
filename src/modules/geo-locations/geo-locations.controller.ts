import {
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
  Request,
  Body,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import throttle from 'lodash/throttle';

import { GeoLocationsService } from './geo-locations.service';
import { CreateGeoLocationDto } from './dto/create-geo-location.dto';
import {
  IGeoLocation,
  GeoLocationList,
} from './interfaces/geo-location.interface';
import { NoonlightService } from '../../utilities/noonlight/noonlight.service';
import { AlertsService } from '../alerts/alerts.service';
import { LocationSubscribeService } from '../location-subscribe/location-subscribe.service';
import { AlertStatus } from '../../constants/enums';
import { AuthGuard } from '../../guards/auth.guard';
@Controller('geo-locations')
@ApiTags('geo-locations')
@ApiBearerAuth()
export class GeoLocationsController {
  constructor(
    private readonly geoLocationService: GeoLocationsService,
    private readonly noonlightService: NoonlightService,
    @Inject(forwardRef(() => AlertsService))
    private readonly alertsService: AlertsService,
    private readonly locationSubscribeService: LocationSubscribeService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() geoLocationData: CreateGeoLocationDto) {
    try {
      console.log('GEOLOCATION DATA :::: CALLED');
      const syncLocationWithNoonlight = async (
        alertId: string,
        location: any,
      ) => {
        const { alarmId, status } = await this.alertsService.findOneById(
          alertId,
        );
        if (alarmId && status === AlertStatus.ALERT) {
          this.noonlightService.updateLocation(alarmId, location);
        }
      };

      const user = req.user;
      const geoLocation = await this.geoLocationService.create(
        user.id,
        geoLocationData,
      );

      const updateGeoLocation = await this.geoLocationService.updateCurrentLocation(
        user.id,
        geoLocationData,
      );

      if (geoLocation) {
        const location = {
          latitude: geoLocation.coordinates[0],
          longitude: geoLocation.coordinates[1],
          accuracy: geoLocation.accuracy,
        };
        // Broadcast location to web client
        this.locationSubscribeService.sendToAllClientsInRoom(
          `alert-${geoLocation.alertId}`,
          'message',
          location,
        );

        // Sync location with Noonlight API
        const throttleSyncLocationWithNoonlight = throttle(
          syncLocationWithNoonlight,
          10000,
        );
        throttleSyncLocationWithNoonlight(geoLocation.alertId, {
          latitude: geoLocation.coordinates[0],
          longitude: geoLocation.coordinates[1],
          accuracy: geoLocation.accuracy,
        });
      }
      return geoLocation;
    } catch (error) {
      console.log('ERR ON GEOLOCATION', error);
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: Number,
  })
  async getAllByUser(
    @Request() req,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
    @Query('from') from?: number,
    @Query('to') to?: number,
  ) {
    const user = req.user;
    return await this.geoLocationService.getAllByUser(user.id, {
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
      from: from ? Number(from) : null,
      to: to ? Number(to) : null,
    });
  }
}
