import {
  Controller,
  Post,
  Body,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { LoggerService } from 'nest-logger';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

type EventData = {
  event_id: string;
  event_type: 'alarm.status.canceled' | 'alarm.psap_contacted' | 'alarm.closed';
  event_time: Date;
  meta: {
    alarm_id: string;
    canceled_by?: {
      phone: string;
    };
  };
};

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  @Post('noonlight')
  async listenNoonlightEvent(
    @Body() eventData: EventData[],
    @Request() req: Request,
  ) {
    this.loggerService.debug(JSON.stringify(eventData, null, 4));
    const event = eventData[0];
    switch (event?.event_type) {
      case 'alarm.psap_contacted':
        this.loggerService.info(
          'Webhook noonlight',
          'called with alarm.psap_contacted',
        );
        // const alarmId = event?.meta.alarm_id;
        break;
      case 'alarm.status.canceled': {
        this.loggerService.info(
          'Webhook noonlight',
          'called with alarm.status.canceled',
        );
        const alarmId = event?.meta.alarm_id;
        const canceledByUserPhone = event?.meta.canceled_by?.phone;

        await this.integrationsService.cancelAlertByNoonlight(
          alarmId,
          canceledByUserPhone,
          'canceled',
        );
        break;
      }
      case 'alarm.closed': {
        this.loggerService.info(
          'Webhook noonlight',
          'called with alarm.closed',
        );
        const alarmId = event?.meta.alarm_id;
        await this.integrationsService.cancelAlertByNoonlight(
          alarmId,
          null,
          'closed',
        );
        break;
      }
    }

    const webhookSecret = this.configService.get<string>(
      'noonlight.webhookSecret',
    );
    const signature = createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('base64');

    if (signature === req.headers.get('X-Noonlight-Signature')) {
      return 'ok';
    }

    return new UnauthorizedException();
  }
}
