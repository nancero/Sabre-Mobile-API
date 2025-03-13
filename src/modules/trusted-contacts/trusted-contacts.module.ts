import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { TrustedContactSchema } from './schemas/trusted-contact.schema';
import { TrustedContactsService } from './trusted-contacts.service';
import { TrustedContactsController } from './trusted-contacts.controller';
import { AuthModule } from '../auth/auth.module';
import { TwilioModule } from '../../utilities/twilio';
import { LoggerModule } from '../../common/logger/logger.module';
import { NotificationModule } from '../../utilities/notification/notification.module';
import { URLShortenerModule } from '../../utilities/url-shortener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TrustedContact', schema: TrustedContactSchema },
    ]),
    TwilioModule,
    LoggerModule,
    NotificationModule,
    ConfigModule,
    URLShortenerModule,
  ],
  providers: [TrustedContactsService],
  controllers: [TrustedContactsController],
  exports: [TrustedContactsService],
})
export class TrustedContactModule {}
