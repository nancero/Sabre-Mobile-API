import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from 'onesignal-node';

@Injectable()
export class NotificationService {
  client: any = null;
  constructor(private readonly configService: ConfigService) {
    const ONESIGNAL_APP_AUTH_KEY = this.configService.get<string>(
      'onesignal.appAuthKey',
    );
    const ONESIGNAL_APP_ID = this.configService.get<string>('onesignal.appId');

    this.client = new OneSignal.Client(
      ONESIGNAL_APP_ID,
      ONESIGNAL_APP_AUTH_KEY,
    );
  }

  pushNotificationToUsers(
    userIds,
    title: string,
    content: string,
    data: object = {},
  ) {
    for (const userId of userIds) {
      const notification = {
        headings: {
          en: title,
        },
        contents: {
          en: content,
        },
        included_segments: ['Subscribed Users'],
        filters: [
          {
            field: 'tag',
            key: 'user_id',
            relation: '=',
            value: userId,
          },
        ],
        data,
      };

      this.client
        .createNotification(notification)
        .then(response => {
          // tslint:disable-next-line: no-console
          console.log(response.body.id);
        })
        .catch(e => {
          if (e instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            // tslint:disable-next-line: no-console
            console.log(e.statusCode);
            // tslint:disable-next-line: no-console
            console.log(e.body);
          }
        });
    }
  }
}
