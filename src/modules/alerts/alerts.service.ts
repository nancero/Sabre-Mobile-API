import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { map, compact } from 'lodash';
import { Types } from 'mongoose';
import { LoggerService } from 'nest-logger';

import { EndAlertDto } from './dto/end-alert.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { IAlert, AlertList, IAlertModel } from './interfaces/alert.interface';
import { GeoLocationsService } from '../geo-locations/geo-locations.service';
import { LocationSubscribeService } from '../location-subscribe/location-subscribe.service';
import { UsersService } from '../users/users.service';
import { NoonlightService } from '../../utilities/noonlight/noonlight.service';
import { NotificationService } from '../../utilities/notification/notification.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AlertStatus } from '../../constants/enums';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel('Alert') private readonly alertModel: IAlertModel,
    private readonly geoLocationsService: GeoLocationsService,
    private readonly noonlightService: NoonlightService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => LocationSubscribeService))
    private readonly locationSubscribeService: LocationSubscribeService,
    private readonly notificationService: NotificationService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly logger: LoggerService,
  ) {}

  async create(createdBy: string, alertData: CreateAlertDto): Promise<IAlert> {
    const { latitude, longitude, isTriggerByDevice, accuracy } = alertData;
    const [user, activeAlert] = await Promise.all([
      this.usersService.findOneById(createdBy),
      this.findActiveAlertByUserId(createdBy),
    ]);

    if (activeAlert) {
      throw new Error('An alert is still active');
    }

    let alarmId = null;
    try {
      const { userSettings } = user;
      if (userSettings?.notifyNoonlight) {
        const subscription = await this.subscriptionsService.getActiveSubscription(
          createdBy,
        );
	console.log("subscription");
        console.log(subscription);
        if (subscription) {
          alarmId = await this.noonlightService.createAlarm(user, {
            latitude,
            longitude,
            accuracy,
          });
        }
      }
      //alarmId = await this.noonlightService.createAlarm(user, {
        // latitude,
         //longitude,
         //accuracy,
       //});
       console.log("sample alarm");
       console.log(alarmId);
    } catch (err) {
      this.logger.error('TCL: AlertsService -> err1', err);

      this.notificationService.pushNotificationToUsers(
        [user._id],
        '[Noonlight] Alarm creation failed',
        'We cannot create the alarm via Noonlight service, please call 911.',
        { type: 'NOONLIGHT', action: 'CALL_911' },
      );
    }

    try {
      const alert = await this.alertModel.create({
        isTriggerByDevice,
        status: AlertStatus.ALERT,
        createdBy,
        alarmId,
      });
      
      const createdAtLocation = await this.geoLocationsService.create(
        createdBy,
        {
          alertId: alert._id,
          latitude,
          longitude,
          accuracy,
        },
      );
      await this.alertModel
        .updateOne(
          { _id: alert._id },
          {
            createdAtLocationId: createdAtLocation._id,
          },
        )
        .exec();

      this.locationSubscribeService.alertTrustedContact(alert._id, createdBy);

      return alert;
    } catch (err) {
      this.logger.error('TCL: AlertsService -> err2', err);
      this.notificationService.pushNotificationToUsers(
        [user._id],
        '[Trusted Contact] Alarm creation failed',
        'We cannot send the alarm to trusted contact via SMS service',
      );
      return null;
    }
  }

  findOneById(id: string) {
    return this.alertModel.findById(Types.ObjectId(id)).exec();
  }

  findAll({
    offset,
    limit,
    orderBy,
    query = {},
    all = false,
  }: {
    offset?: number;
    limit?: number;
    orderBy?: any;
    query?: any;
    all?: boolean;
  }): Promise<AlertList> {
    const newLimit = all
      ? Number.MAX_SAFE_INTEGER
      : limit && limit > 10
      ? 10
      : limit || 10;
    const sort: any = {
      createdAt: orderBy?.createdAt > 0 ? 1 : -1,
    };

    const options = { offset, limit: newLimit, sort };
    return this.alertModel.paginate(query, options);
  }

  async findAllInLocation({
    topLeftLat,
    topLeftLong,
    rightBottomLat,
    rightBottomLong,
  }: {
    topLeftLat: number;
    topLeftLong: number;
    rightBottomLat: number;
    rightBottomLong: number;
  }): Promise<AlertList> {
    const geoLocationIds = await this.geoLocationsService.findAllInLocation({
      topLeftLat,
      topLeftLong,
      rightBottomLat,
      rightBottomLong,
    });
    return this.alertModel.paginate(
      {
        createdAtLocationId: {
          $in: map(compact(geoLocationIds.docs), ({ _id }) => _id),
        },
      },
      {},
    );
  }

  async endAlertByUser(
    id: string,
    alertData: EndAlertDto,
    status: string,
  ): Promise<IAlert> {
    const { alarmId, createdBy } = await this.alertModel.findById(id);

    const [endAtLocation, userCreatedAlert] = await Promise.all([
      this.geoLocationsService.create(createdBy, { alertId: id, ...alertData }),
      this.usersService.findOneById(createdBy),
    ]);

    if (alarmId) {
      await this.noonlightService.cancelAlarm(
        alarmId,
        userCreatedAlert.pinCode,
      );
    }

    const updatedAlert = await this.updateEndAlert(
      { _id: id },
      {
        endAt: Date.now(),
        status,
        endAtLocationId: endAtLocation._id,
      },
    );

    this.locationSubscribeService.alertEndAlertToTrustedContact(
      id,
      userCreatedAlert._id,
      status,
    );

    return updatedAlert;
  }

  updateEndAlert(query: any, alertData: any) {
    const updatedAlertRes =  this.alertModel.findOneAndUpdate(query, alertData, { new: true });
    console.log("updatedAlert",updatedAlertRes);
    return updatedAlertRes;
  }

  cancel(id: string, alertData: EndAlertDto) {
    return this.endAlertByUser(id, alertData, AlertStatus.CANCELLED);
  }

  safe(id: string, alertData: EndAlertDto) {
    return this.endAlertByUser(id, alertData, AlertStatus.SAFE);
  }

  async checkIfUserInAlert(id: string): Promise<boolean> {
    const alert = await this.alertModel
      .findOne({
        createdBy: id,
        status: AlertStatus.ALERT,
      })
      .exec();
    return alert ? true : false;
  }

  findOne(query): Promise<IAlert> {
    return this.alertModel.findOne(query).exec();
  }

  async cancelAlertByNoonlight(
    alarmId: string,
    canceledBy: string,
    alarmStatus: string,
  ): Promise<IAlert> {
    const status = AlertStatus.CANCELLED;

    const updatedAlert = await this.updateEndAlert(
      { alarmId },
      {
        endAt: Date.now(),
        status,
        canceledBy,
        alarmStatus,
      },
    );

    if (updatedAlert) {
      this.locationSubscribeService.alertEndAlertToTrustedContact(
        updatedAlert._id,
        updatedAlert.createdBy,
        status,
      );
    }
    return updatedAlert;
  }

  findActiveAlertByUserId(userId: any) {
    return this.alertModel
      .findOne({ createdBy: userId, status: AlertStatus.ALERT })
      .sort({ _id: -1 })
      .exec();
  }
}
