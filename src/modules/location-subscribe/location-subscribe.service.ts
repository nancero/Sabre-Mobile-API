import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Schema } from 'mongoose';
import { map } from 'lodash';
import { LoggerService } from 'nest-logger';
import { ConfigService } from '@nestjs/config';

import { LocationSubscribeGateway } from './location-subscribe.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { UsersService } from '../users/users.service';
import { TrustedContactsService } from '../trusted-contacts/trusted-contacts.service';
import { TrustedContactList } from '../trusted-contacts/interfaces/trusted-contact.interface';
import { TwilioService } from '../../utilities/twilio';
import { URLShortenerService } from '../../utilities/url-shortener/url-shortener.service';
import { AlertStatus } from '../../constants/enums';
import { GeoLocationsService } from '../geo-locations/geo-locations.service';

// const radius = 0.5;

@Injectable()
export class LocationSubscribeService {
  // user's alert room: alert-${userId}
  constructor(
    @Inject(forwardRef(() => AlertsService))
    private readonly alertsService: AlertsService,
    private readonly usersService: UsersService,
    private readonly trustedContactsService: TrustedContactsService,
    private readonly twilioService: TwilioService,
    private readonly locationSubscribeGateway: LocationSubscribeGateway,
    private readonly loggerService: LoggerService,
    private readonly urlShortenerService: URLShortenerService,
    private readonly configService: ConfigService,
    private readonly geoLocationService : GeoLocationsService
  ) {}

  getRoomNameByAlertId(alertId: string) {
    return `alert-${alertId}`;
  }

  async getRoomNameByUserId(userId: string) {
    const alert = await this.alertsService.findActiveAlertByUserId(userId);

    if (!alert) {
      return undefined;
    }

    return alert && `alert-${alert._id}`;
  }

  sendToAllClientsInRoom(room, eventName, data) {
    this.locationSubscribeGateway.sendToAllClientsInRoom(room, eventName, data);
  }

  // async alertAllUsersInArea(userId: string) {
  //   const alertOfUserData = await this.alertsService.findAll({
  //     query: {
  //       createdBy: userId,
  //       status: AlertStatus.ALERT,
  //     },
  //     all: true,
  //   });
  //   const alertOfUser = alertOfUserData.docs;
  //   // check if user is in alert status
  //   if (!alertOfUser || alertOfUser.length === 0) {
  //     return;
  //   }
  //   // get user's latest location
  //   const userLatestLocation = await this.geoLocationsService.getUserLatestLocation(
  //     userId,
  //   );
  //   const location = userLatestLocation.coordinates;
  //   const latitude = location[0];
  //   const longitude = location[1];

  //   // find user in area
  //   const userInLocationRes = await this.geoLocationsService.getAllNearbyUserLatestLocation(
  //     {
  //       latitude,
  //       longitude,
  //     },
  //     {
  //       userId: {
  //         $ne: userId,
  //       },
  //     },
  //   );
  //   const userInLocation = map(compact(userInLocationRes), user =>
  //     Types.ObjectId(user.userId),
  //   );
  //   const allUsers = await this.usersService.findAll({
  //     all: true,
  //     query: {
  //       _id: {
  //         $in: userInLocation,
  //       },
  //     },
  //   });
  //   const allSocketIds = allUsers.docs.map(user => user.socketId);
  //   const allUserIds = allUsers.docs.map(user => user._id);
  //   this.notificationService.pushNotificationToUsers(
  //     allUserIds,
  //     'Alert!!',
  //     'Alert in your location',
  //   );
  //   // add all user to room
  //   const roomName = this.getRoomNameByAlertId(userId);
  //   this.locationSubscribeGateway.addSocketsToRooms(
  //     compact(allSocketIds),
  //     roomName,
  //   );
  // }

  async alertTrustedContact(alertId: string, userId: string) {
    const user = await this.usersService.findOneById(userId);

    // #1: Do nothing if notifyTrustedList turned off
    if (!user || !user.userSettings || !user.userSettings.notifyTrustedList) {
      return;
    }

    // #2 only send SMS to verified phones
    const trustedContactData: TrustedContactList = await this.trustedContactsService.getTrustedContacts(
      { query: { userId, phoneNumberVerified: true }, all: true },
    );

    // get user's trusted contacts
    if (trustedContactData?.totalDocs === 0) {
      return;
    }

    // get user's latest location
    const trustedContacts = trustedContactData?.docs;
    const trustedContactPhones = map(
      trustedContacts,
      (trustedContact) => trustedContact?.phone,
    );

    // twilio call
    const { firstName, lastName } = user;
    this.loggerService.debug(
      `/tracking/${alertId}`,
      'LocationSubscribeService ',
    );
    const mapURL = `${this.configService.get(
      'app.webappUri',
    )}/tracking/${alertId}`;

    const shortenURL = await this.urlShortenerService.shorten(mapURL);
    const location = await this.geoLocationService.getUserLatestLocation( userId );
    console.log("location.....", location);
    const latitude = location.coordinates[0];
    const longitude = location.coordinates[1];
    const message = `${firstName} ${lastName} has triggered a Safety Alert.\n Their GPS coordinates Latitude: ${latitude} and Longitude: ${longitude}.\n Please check your text message for their location here: ${mapURL}`;
    const voiceMessage = `${firstName} ${lastName} has triggered a Safety Alert.\n Please check your text message for their location and GPS coordinates.\n NOTICE: create a contact for SABRE Alert Notification coming from 312-262-5395`;
    
    this.twilioService
      .sendManySMS(trustedContactPhones, message)
      .catch((err) => {
        this.loggerService.error(
          err.message,
          'twilioService',
          `${LocationSubscribeService.name} -> alertTrustedContact`,
        );
      });

    this.twilioService
      .sendManyCalls(trustedContactPhones, voiceMessage)
      .catch((err) => {
        this.loggerService.error(
          err.message,
          'twilioService',
          `${LocationSubscribeService.name} -> alertTrustedContact`,
        );
      });
  }

  async alertEndAlertToTrustedContact(
    alertId: string | string,
    userId: string,
    status: string,
  ) {
    const user = await this.usersService.findOneById(userId);

    // #1: Do nothing if notifyTrustedList turned off
    if (!user || !user.userSettings || !user.userSettings.notifyTrustedList) {
      return;
    }

    // #2 only send SMS to verified phones
    const trustedContactData = await this.trustedContactsService.getTrustedContacts(
      { query: { userId, phoneNumberVerified: true }, all: true },
    );

    if (trustedContactData.totalDocs === 0) {
      return;
    }

    const trustedContacts = trustedContactData.docs;
    const trustedContactPhones = map(
      trustedContacts,
      (trustedContact) => trustedContact.phone,
    );

    const { phone, firstName, lastName } = user;
    const prefixMsg = `${firstName} ${lastName}`;
    const isCancelled = status === AlertStatus.CANCELLED;
    const midMsg = isCancelled
      ? 'has canceled the alert for help from the SABRE Safety app.'
      : 'has marked themselves as safe in the SABRE Safety app.';
    const suffixMsg = ` Contact them here: ${phone}`;
    const message = `${prefixMsg} ${midMsg} ${suffixMsg}`;

    this.twilioService
      .sendManySMS(trustedContactPhones, message)
      .catch((err) => {
        this.loggerService.error(
          err.message,
          'twilioService',
          `${LocationSubscribeService.name} -> alertEndAlertToTrustedContact`,
        );
      });

    // #3 Send message for all clients in room alert-{alertId}
    this.locationSubscribeGateway.sendToAllClientsInRoom(
      `alert-${alertId}`,
      'alert-end',
      {
        userMessage: message,
        alert: {
          status,
        },
      },
    );
  }

  // // find all nearby alert to subscribe
  // async subscribeToNearbyAlert(userId: string) {
  //   // get user's location
  //   // get users in alert status
  //   const promises: [
  //     Promise<IUser>,
  //     Promise<IGeoLocation>,
  //     Promise<AlertList>,
  //   ] = [
  //     this.usersService.findOneById(userId),
  //     this.geoLocationsService.getUserLatestLocation(userId),
  //     this.alertsService.findAll({
  //       all: true,
  //       query: {
  //         status: AlertStatus.ALERT,
  //         createdBy: {
  //           $ne: userId,
  //         },
  //       },
  //     }),
  //   ];
  //   const [user, userLatestLocation, alertingAlertsRes] = await Promise.all(
  //     promises,
  //   );

  //   // there's no user in alert -> return
  //   if (alertingAlertsRes.totalDocs === 0) {
  //     return;
  //   }

  //   const socketId = user.socketId;
  //   const location = userLatestLocation.coordinates;
  //   const latitude = location[0];
  //   const longitude = location[1];
  //   const alertingAlerts = alertingAlertsRes.docs;
  //   const userIdsInAlert = alertingAlerts.map(({ createdBy }) => createdBy);

  //   const alertGeoLocationNearbyRes = await this.geoLocationsService.getAllNearbyUserLatestLocation(
  //     {
  //       latitude,
  //       longitude,
  //     },
  //     {
  //       userId: {
  //         $in: userIdsInAlert,
  //       },
  //     },
  //   );
  //   // => get all nearby users is alert
  //   for (const geoLocation of alertGeoLocationNearbyRes) {
  //     const roomName = this.getRoomNameByAlertId(geoLocation.userId);
  //     this.locationSubscribeGateway.addSocketsToRooms([socketId], roomName);
  //     this.locationSubscribeGateway.sendToIndividualSocketId(socketId, {
  //       userId: geoLocation.userId,
  //       location: geoLocation.coordinates,
  //     });
  //   }
  // }

  // // user mark alert as safe or cancel
  // cancelAlert(userId: string) {
  //   const roomName = this.getRoomNameByAlertId(userId);
  //   this.locationSubscribeGateway.leaveRoom(roomName);
  // }
}
