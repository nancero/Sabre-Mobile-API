import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  IGeoLocationModel,
  IGeoLocation,
} from './interfaces/geo-location.interface';
import { CreateGeoLocationDto } from './dto/create-geo-location.dto';
import { Schema } from 'mongoose';
import { IAlertModel } from '../alerts/interfaces/alert.interface';

@Injectable()
export class GeoLocationsService {
  constructor(
    @InjectModel('GeoLocation')
    private readonly geoLocationModel: IGeoLocationModel,
    @InjectModel('Alert')
    private readonly alertModel: IAlertModel,
  ) {}

  create(userId: string, geoLocationData: CreateGeoLocationDto) {
    const { latitude, longitude, accuracy, alertId } = geoLocationData;
    if (alertId) {
      const geolocationInput = {
        userId,
        coordinates: [latitude, longitude],
        accuracy,
        alertId,
      };
      return this.geoLocationModel.create(geolocationInput);
    }

    return null;
  }

  async updateCurrentLocation(userId: string, geoLocationData: CreateGeoLocationDto) {
    const { latitude, longitude, accuracy, alertId } = geoLocationData;
    if (alertId) {
      const geolocationInput = {
        userId,
        coordinates: [latitude, longitude],
        accuracy,
        alertId,
      };
      const geoLocation = await this.geoLocationModel.create(geolocationInput);

      await this.alertModel
        .updateOne(
          { _id: alertId },
          {
            currentLocationId: geoLocation._id,
          },
        )
        .exec();
      console.log('Alert Updated ::::::::::::::::::',alertId,latitude,longitude)
    }

    return null;
  }
  findAllInLocation(
    {
      topLeftLat,
      topLeftLong,
      rightBottomLat,
      rightBottomLong,
    }: {
      topLeftLat: number;
      topLeftLong: number;
      rightBottomLat: number;
      rightBottomLong: number;
    },
    onlyId: boolean = true,
    query: any = {},
  ) {
    const fullQuery = {
      'coordinates.0': {
        $gte: topLeftLat,
        $lte: rightBottomLat,
      },
      'coordinates.1': {
        $gte: topLeftLong,
        $lte: rightBottomLong,
      },
      ...query,
    };
    const option: any = {};
    if (onlyId) {
      option.select = '_id';
    }
    return this.geoLocationModel.paginate(fullQuery, option);
  }

  getUserLatestLocation(userId: string) {
    return this.geoLocationModel
      .findOne({ userId }, null, {
        sort: {
          createdAt: -1,
        },
      } as any)
      .exec();
  }

  async getAllNearbyUserLatestLocation(
    {
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    },
    query: any = {},
  ): Promise<IGeoLocation[]> {
    return await this.geoLocationModel
      .aggregate([
        {
          $match: {
            ...query,
            createdAt: {
              $gte: new Date(Date.now() - 1000 * 60 * 60 * 12), // search in only last 12h
            },
          },
        },
        // mongo geoJs use coordinates as [long, lat] so we need to transform first
        {
          $addFields: {
            newCoords: {
              type: 'Point',
              coordinates: [
                {
                  $arrayElemAt: ['$coordinates', 1],
                },
                {
                  $arrayElemAt: ['$coordinates', 0],
                },
              ],
            },
          },
        },
        {
          $match: {
            newCoords: {
              $geoWithin: {
                $centerSphere: [[longitude, latitude], 0.5 / 6378.1],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: '$userId',
            coordinates: { $first: '$coordinates' },
            type: { $first: '$type' },
            userId: { $first: '$userId' },
          },
        },
      ])
      .exec();
  }

  getAllByUser(
    userId: string,
    {
      offset,
      limit,
      orderBy,
      from,
      to,
    }: {
      offset?: number;
      limit?: number;
      orderBy?: any;
      from?: number;
      to?: number;
    },
  ) {
    const query: any = { userId };
    if (from) {
      const fromDate = new Date(from);
      query.createdAt = {};
      query.createdAt.$gte = fromDate;
    }
    if (to) {
      if (!query.createdAt) {
        query.createdAt = {};
      }
      const toDate = new Date(to);
      query.createdAt.$lt = toDate;
    }
    const sort: any = {
      // createdAt: orderBy && orderBy.createdAt > 0 ? 1 : -1,
    };
    sort.createdAt = orderBy && orderBy.createdAt > 0 ? 1 : -1;

    limit = limit && limit > 10 ? 10 : limit || 10;
    const options = { offset, limit, sort };
    return this.geoLocationModel.paginate(query, options);
  }

  getLocationById(locationId: string) {
    return this.geoLocationModel.findById(locationId).exec();
  }

  getAllLocationsByAlertId(alertId: string) {
    if (!alertId) {
      return null;
    }

    return this.geoLocationModel
      .find({
        alertId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();
  }
}
