import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schema } from 'mongoose';
import { LoggerService } from 'nest-logger';
import { ConfigService } from '@nestjs/config';

import { IUserModel, IUser } from './interfaces/user.interface';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { TwilioService } from '../../utilities/twilio';
import { convertPhone } from '../../common/helpers/phone-utils';
import { MailerService } from '../../utilities/mailer';
import {
  VerificationMethodType,
  VerificationMethod,
} from '../../constants/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: IUserModel,
    private readonly twilioService: TwilioService,
    private readonly loggerService: LoggerService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  findOne(query) {
    return this.userModel.findOne(query);
  }

  create(userData) {
    return this.userModel.create(userData);
  }

  updatePinCode(userId: string, pinCode: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      pinCode,
      pinCodeSetup: true,
    });
  }

  async sendResetPasswordOTP(
    phoneInput: string,
    verificationMethod: string,
  ): Promise<boolean> {
    const phone = convertPhone(phoneInput);
    const user = await this.findOneByPhone(phone);
    if (user) {
      if (verificationMethod === 'call') {
        await this.twilioService.sendOTP(user.phone, verificationMethod);
        return true;
      }

      if (verificationMethod === 'sms') {
        const resetPasswordOTP = await user.saveResetPasswordOTP();
        const message = `Sabre App OTP is ${resetPasswordOTP}. This OTP is valid for 3 minutes.`;
        this.sendOTPViaSMS({
          phone: user.phone,
          message,
        });
        return true;
      }
    }
    throw Error(`Phone number ${phone} is not registered yet`);
  }

  async sendOTPViaSMS({ phone, message }: { phone: string; message: string }) {
    try {
      await this.twilioService.sendSMS(phone, message);
      return 'ok';
    } catch (err) {
      this.loggerService.error(
        err.message,
        'twilioService',
        `${UsersService.name} -> resendOTP`,
      );
    }
  }

  async sendOTPViaEmail({
    email,
    fullName,
    otp,
  }: {
    email: string;
    otp: string;
    fullName: string;
  }) {
    try {
      await this.mailerService.sendMail({
        from: this.configService.get('mail.emailFrom'),
        to: email,
        subject: '[Sabre] OTP Verification',
        template: 'otp-verification',
        context: {
          otp,
          fullName,
        },
      });

      this.loggerService.info(
        `Email sent ${email} successfully`,
        UsersService.name,
      );

      return 'ok';
    } catch (err) {
      this.loggerService.error(
        `Email sent fail: ${err.message}`,
        err.stack,
        UsersService.name,
      );
    }
  }

  async sendOTP(user: IUser, verificationMethod: VerificationMethodType) {
    const otp = await user.saveOTP();
    if (verificationMethod === VerificationMethod.EMAIL) {
      this.sendOTPViaEmail({
        email: user.email,
        otp,
        fullName: `${user.firstName} ${user.lastName}`,
      });
      return true;
    }

    if (verificationMethod === VerificationMethod.SMS) {
      const message = `Sabre App OTP is ${otp}. This OTP is valid for 3 minutes.`;
      this.sendOTPViaSMS({
        phone: user.phone,
        message,
      });
      return true;
    }

    if (verificationMethod === VerificationMethod.CALL) {
      this.twilioService.sendOTP(user.phone, verificationMethod);
      return true;
    }
  }

  async verifyOTP(
    user: IUser,
    verificationMethod: VerificationMethodType,
    OTP: string,
  ) {
    if (verificationMethod === VerificationMethod.CALL) {
      const verificationResult = await this.twilioService.verifyOTP(
        user.phone,
        verificationMethod,
      );

      if (verificationResult.status === 'approved') {
        await this.userModel.findByIdAndUpdate(user.id, {
          $set: { phoneNumberVerified: true },
        });

        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    }

    const result = await this.userModel.findOneAndUpdate(
      {
        _id: user.id,
        OTP,
        OTPExpired: {
          $gt: new Date(),
        },
      },
      {
        $set: { phoneNumberVerified: true },
      },
    );

    return {
      success: result ? true : false,
    };
  }

  async verifyResetPasswordOTP({
    phone: phoneInput,
    OTP,
    verificationMethod,
  }: {
    phone: string;
    OTP: string;
    verificationMethod: string;
  }) {
    const phone = convertPhone(phoneInput);
    if (verificationMethod === 'call') {
      const verificationResult = await this.twilioService.verifyOTP(phone, OTP);
      if (verificationResult.status === 'approved') {
        const user = await this.userModel.findOne({
          phone,
        });
        return await user.saveResetToken();
      }
    }

    if (verificationMethod === 'sms') {
      const user = await this.userModel.findOne({
        phone,
        resetPasswordOTP: OTP,
        resetPasswordOTPExpired: {
          $gt: new Date(),
        },
      });

      if (user) {
        return await user.saveResetToken();
      }
    }
  }

  findOneById(id: string) {
    return this.userModel
      .findById(id)
      .select([
        '-password',
        '-OTP',
        '-OTPExpired',
        '-pinCode',
        '-resetPasswordOTP',
        '-resetPasswordOTPExpired',
        '-resetPasswordToken',
        '-resetPasswordExpires',
        '-refreshToken',
        '-refreshTokenExpiresIn',
      ])
      .exec();
  }

  findOneByPhone(phone: string) {
    return this.userModel
      .findOne({ phone })
      .select([
        '-password',
        '-OTP',
        '-OTPExpired',
        '-pinCode',
        '-resetPasswordOTP',
        '-resetPasswordOTPExpired',
        '-resetPasswordToken',
        '-resetPasswordExpires',
        '-refreshToken',
        '-refreshTokenExpiresIn',
      ])
      .exec();
  }

  deleteOneById(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async getUserSettings(id: string) {
    const user = await this.findOneById(id);
    if (user) {
      return user.getUserSettings();
    }
    throw new Error('User not found');
  }

  async checkUserPassword(userId: string, password: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return false;
    }

    return await user.checkPassword(password);
  }

  async updateUserSettings(id: string, userSettings: UpdateUserSettingsDto) {
    const listUpdate = {};
    // tslint:disable-next-line: forin
    for (const key in userSettings) {
      listUpdate[`userSettings.${key}`] = userSettings[key];
    }
    await this.userModel
      .updateOne(
        { _id: id },
        {
          $set: listUpdate,
        },
      )
      .exec();
    return await this.getUserSettings(id);
  }

  updateUserProfile(_id: string, userProfile: UpdateUserProfileDto) {
    return this.userModel
      .findOneAndUpdate({ _id }, userProfile, {
        new: true,
      })
      .select([
        '-password',
        '-OTP',
        '-OTPExpired',
        '-pinCode',
        '-resetPasswordOTP',
        '-resetPasswordOTPExpired',
        '-resetPasswordToken',
        '-resetPasswordExpires',
        '-refreshToken',
        '-refreshTokenExpiresIn',
      ]);
  }

  updateSocketId(userId, socketId) {
    return this.userModel.findByIdAndUpdate(userId, { socketId }).exec();
  }

  async findAll({
    offset,
    limit,
    orderBy,
    all = false,
    query = {},
  }: {
    offset?: number;
    limit?: number;
    orderBy?: any;
    query?: any;
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
    return this.userModel.paginate(query, options);
  }

  updateNoonlightRefreshToken(
    userId: Schema.Types.ObjectId,
    noonlightRefreshToken: string,
  ) {
    return this.userModel.findByIdAndUpdate(userId, {
      noonlightRefreshToken,
    });
  }
}
