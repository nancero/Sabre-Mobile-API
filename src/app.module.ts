import { Module } from '@nestjs/common';
// import { join } from 'path';
// import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import nodemailerSendgrid from 'nodemailer-sendgrid';

import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TrustedContactModule } from './modules/trusted-contacts/trusted-contacts.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { GeoLocationsModule } from './modules/geo-locations/geo-locations.module';
import { LocationSubscribeModule } from './modules/location-subscribe/location-subscribe.module';
import { PhotosModule } from './modules/photos/photos.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { LoggerModule } from './common/logger/logger.module';
import configuration, { envValidationSchema } from './config';
import { NoonlightModule } from './utilities/noonlight/noonlight.module';
import { MailerModule, HandlebarsAdapter } from './utilities/mailer';
import { NotificationModule } from './utilities/notification/notification.module';
import { FileUploadModule } from './utilities/file-upload';
import { TwilioModule } from './utilities/twilio';
import { IAPModule } from './utilities/iap';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [configuration],
    }),

    ScheduleModule.forRoot(),

    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '../..', 'client/build'),
    // }),

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: nodemailerSendgrid({
          apiKey: configService.get<string>('mailer.sendgridApiKey'),
        }),
        defaults: {
          from: configService.get<string>('mailer.sender'),
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),

    TwilioModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        accountSid: configService.get<string>('twilio.accountSid'),
        authToken: configService.get<string>('twilio.authToken'),
        twilioNumber: configService.get<string>('twilio.twilioNumber'),
        verificationSid: configService.get<string>('twilio.verificationSid'),
      }),
    }),

    FileUploadModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        awsAccessKeyId: configService.get('aws.accessKeyId'),
        awsRegion: configService.get('aws.region'),
        awsSecretAccessKey: configService.get('aws.secretAccessKey'),
        awsBucketName: configService.get('aws.bucketName'),
      }),
    }),

    LoggerModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    AlertsModule,
    TrustedContactModule,
    GeoLocationsModule,
    LocationSubscribeModule,
    PhotosModule,
    NotificationModule,
    NoonlightModule,
    IntegrationsModule,
    SubscriptionsModule,
    IAPModule,
  ],
})
export class AppModule {}
