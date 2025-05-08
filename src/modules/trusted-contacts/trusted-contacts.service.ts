import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { LoggerService } from 'nest-logger';
import { ConfigService } from '@nestjs/config';

import { ITrustedContactModel } from './interfaces/trusted-contact.interface';
import { CreateTrustedContactDto } from './dto/create-trusted-contact.dto';
import { UpdateTrustedContactDto } from './dto/update-trusted-contact.dto';
import { TwilioService } from '../../utilities/twilio';
import { IUser } from '../users/interfaces/user.interface';
import { NotificationService } from '../../utilities/notification/notification.service';
import { URLShortenerService } from '../../utilities/url-shortener';

@Injectable()
export class TrustedContactsService {
  constructor(
    @InjectModel('TrustedContact')
    private readonly trustedContactModel: ITrustedContactModel,
    private readonly twilioService: TwilioService,
    private readonly loggerService: LoggerService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly urlShortenerService: URLShortenerService,
  ) {}

  async create(trustedContactData: CreateTrustedContactDto, user: IUser) {
    // don't allow to add yourself
    if (trustedContactData.phone === user.phone) {
      throw new Error('You cannot add yourself as your trusted contact.');
    }

    // check whether this phone is added as trusted contact or not
    const foundTrustedContact = await this.trustedContactModel.findOne({
      userId: user._id,
      phone: trustedContactData.phone,
    });

    if (foundTrustedContact) {
      throw new Error(
        'This phone number has already been added as a selected contact.',
      );
    }

    // create trusted contact
    const verifyToken = randomBytes(16).toString('hex');
    const createdTrustedContact = await this.trustedContactModel.create({
      ...trustedContactData,
      userId: user._id,
      verifyToken,
    });
    // send verify link to trusted contact
    const { phone } = createdTrustedContact;
    const activeUrl = `${this.configService.get(
      'app.serverUri',
    )}/api/trusted-contacts/verify/${verifyToken}`;
    console.log(activeUrl, 'ActiveURL1');
    const shortenURL = await this.urlShortenerService.shorten(activeUrl);

    this.twilioService
      .sendSMS(
        phone,
        // `${user.firstName} ${user.lastName} added you as a trusted contact on SABRE app. Complete verification by clicking this link: ${shortenURL}`,
        `${user.firstName} ${user.lastName} added you as a trusted contact on SABRE app. Complete verification by clicking this link: ${activeUrl}`,
      )
      .catch((err) => {
        this.loggerService.error(
          JSON.stringify(err),
          'twilioService',
          `${TrustedContactsService.name} -> create`,
        );
      });

    return createdTrustedContact;
  }

  async resendVerifyLink(trustedContactId: string, user: IUser) {
    if (!trustedContactId) {
      return new BadRequestException('Trusted contact id is invalid!');
    }
    // TODO: should cache resend link times for avoid spamming SMS
    const foundTrustedContact =
      trustedContactId &&
      (await this.trustedContactModel.findById(trustedContactId));

    if (!foundTrustedContact) {
      throw new Error('There is no trusted contact found.');
    }

    const verifyToken = randomBytes(16).toString('hex');
    await this.trustedContactModel.findByIdAndUpdate(trustedContactId, {
      verifyToken,
    });

    const activeUrl = `${this.configService.get(
      'app.serverUri',
    )}/api/trusted-contacts/verify/${verifyToken}`;
    const shortenURL = await this.urlShortenerService.shorten(activeUrl);
    console.log(activeUrl, 'ActiveURL2');
    this.twilioService
      .sendSMS(
        foundTrustedContact.phone,
        // `${user.firstName} ${user.lastName} added you as a trusted contact on SABRE app. Complete verification by clicking this link: ${shortenURL}`,
        `${user.firstName} ${user.lastName} added you as a trusted contact on SABRE app. Complete verification by clicking this link: ${activeUrl}`,
      )
      .catch((err) => {
        this.loggerService.error(
          JSON.stringify(err),
          'twilioService',
          `${TrustedContactsService.name} -> resendVerifyLink`,
        );
      });

    return { success: true };
  }

  async verifyPhone(verifyToken: string) {
    const trustedContact = await this.trustedContactModel
      .findOne({
        verifyToken,
      })
      .exec();
    if (!trustedContact) {
      throw new Error('Can not find your verify token');
    }
    if (trustedContact.phoneNumberVerified) {
      return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f9f9f9;
      }
      h1 {
        font-size: clamp(1.5rem, 10vw, 3rem);
        text-align: center;
        color: black;
      }
    </style>  
  </head>
  <body>
    <h1>Already Verified</h1>
  </body>
  </html>
  `;
    }

    this.notificationService.pushNotificationToUsers(
      [trustedContact.userId],
      '[Sabre] Your trusted contact verified',
      `${trustedContact.firstName} ${trustedContact.lastName}(${trustedContact.phone}) is verified successfully`,
      {
        action: 'UPDATE_TRUSTED_CONTACT',
      },
    );

    await this.trustedContactModel
      .findOneAndUpdate(
        {
          verifyToken,
        },
        {
          phoneNumberVerified: true,
        },
      )
      .exec();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verification</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f9f9f9;
          }
          h1 {
            font-size: clamp(1.5rem, 10vw, 3rem);
            text-align: center;
            color: black;
          }
        </style>
      </head>
      <body>
        <h1>Your number is verified successfully</h1>
      </body>
      </html>
      `;
  }

  deleteOneById(id: string) {
    return this.trustedContactModel.findByIdAndDelete(id).exec();
  }

  updateOneById(id: string, trustedContactData: UpdateTrustedContactDto) {
    return this.trustedContactModel
      .updateOne({ _id: id }, trustedContactData)
      .exec();
  }

  findOneAndUpdate(id: string, trustedContactData: UpdateTrustedContactDto) {
    return this.trustedContactModel.findOneAndUpdate(
      { _id: id },
      trustedContactData,
      { new: true },
    );
  }

  findOneById(id: string) {
    return this.trustedContactModel.findById(id).exec();
  }

  getTrustedContacts({
    query,
    offset,
    limit,
    orderBy,
    all = false,
  }: {
    query?: object;
    offset?: number;
    limit?: number;
    orderBy?: any;
    all?: boolean;
  }) {
    const newLimit = all
      ? Number.MAX_SAFE_INTEGER
      : limit && limit > 10
      ? 10
      : limit || 10;
    const sort: any = {};
    sort.createdAt = orderBy && orderBy.createdAt > 0 ? 1 : -1;
    const options = { offset, limit: newLimit, sort };
    return this.trustedContactModel.paginate(query, options);
  }

  getTotal(userId: string) {
    return this.trustedContactModel
      .countDocuments({
        userId,
      })
      .exec();
  }
}
