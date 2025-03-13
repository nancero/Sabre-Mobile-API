import { Schema, model, HookNextFunction } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import mongoosePaginate = require('mongoose-paginate-v2');

import { IUser, IUserModel } from '../interfaces/user.interface';
import createOTP from '../../../common/helpers/create-otp';
import { convertPhone } from '../../../common/helpers/phone-utils';

const UserSettingSchema: Schema = new Schema({
  notifyTrustedList: { type: Boolean, default: true },
  notifySabreUsers: { type: Boolean, default: false },
  notifyNoonlight: { type: Boolean, default: false },
});

export const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    socketId: { type: String, required: false },
    phone: { type: String, unique: true, required: true, index: true },
    phoneNumberVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    pinCodeSetup: { type: Boolean, default: false },

    roles: { type: [String], default: ['user'], require: true },
    provider: { type: String, default: 'local' },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    sabreCommunityMember: { type: Boolean, default: true },

    // Private
    refreshToken: String,
    refreshTokenExpiresIn: Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    OTP: String,
    OTPExpired: Date,
    pinCode: { type: String, default: null },
    resetPasswordOTP: String,
    resetPasswordOTPExpired: Date,

    // Devices
    sabreUUID: String,
    deviceIds: [String],

    // User Setting
    userSettings: {
      type: UserSettingSchema,
      default: () => UserSettingSchema,
    },

    // Profiles
    avatar: String,
    gender: String,
    hairColor: String,
    eyeColor: String,
    skinColor: String,
    height: String,
    weight: String,
    medicalInformation: String,
  },
  {
    timestamps: true,
    usePushEach: true,
  },
);

/**
 * Validators
 */
// UserSchema.path('phone').validate(
//   phone => validator.isMobilePhone(phone, 'en-US', { strictMode: true }),
//   'The phone is not a valid format of International US phone number.',
// );

/**
 * Helpers
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  return hash;
}

/**
 * Pre-save hooks
 */
// need to add to users.config, dont know why it not work
UserSchema.pre<IUser>('save', async function (next: HookNextFunction) {
  const OTP_EXPIRED_TIME = Number(process.env.AUTH_OTP_EXPIRED_TIME) * 1000;
  if (this.isNew) {
    const OTP = await createOTP();
    this.OTP = OTP;
    this.OTPExpired = new Date(Date.now() + OTP_EXPIRED_TIME);
  }

  this.phone = convertPhone(this.phone);

  // Make sure not to rehash the password if it is already hashed
  if (!this || !this.isModified('password')) {
    next();
    return;
  }

  // Generate a salt and use it to hash the user's password
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
  return;
});

/**
 * Methods
 */
UserSchema.methods = {
  checkPassword(password): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  },
  /**
   * Generate reset password token
   * @param  {Function} Callback(error, resetToken)
   */
  async generateResetToken() {
    return await bcrypt.genSalt(10);
  },
  async saveResetToken() {
    this.resetPasswordToken = await this.generateResetToken();
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    this.save();
    return this.resetPasswordToken;
  },
  async saveResetPasswordOTP() {
    const OTP_EXPIRED_TIME = Number(process.env.AUTH_OTP_EXPIRED_TIME) * 1000;
    this.resetPasswordOTP = await createOTP();
    this.resetPasswordOTPExpired = new Date(Date.now() + OTP_EXPIRED_TIME);

    this.save();
    return this.resetPasswordOTP;
  },
  async saveOTP() {
    const OTP_EXPIRED_TIME = Number(process.env.AUTH_OTP_EXPIRED_TIME) * 1000;
    this.OTP = await createOTP();
    this.OTPExpired = new Date(Date.now() + OTP_EXPIRED_TIME);
    await this.save();
    return this.OTP;
  },
  getUserSettings() {
    return this.userSettings;
  },
};

UserSchema.plugin(mongoosePaginate);

const UserModel: IUserModel = model<IUser, IUserModel>('User', UserSchema);

export default UserModel;
