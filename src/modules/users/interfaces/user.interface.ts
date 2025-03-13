import { Model, Document } from 'mongoose';
import { IUserSettings } from './user-settings.interface';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  medicalInformation: string;
  phone: string;
  phoneNumberVerified: boolean;
  sabreUUID: string;
  socketId: string;
  userSettings: {
    notifyTrustedList: boolean;
    notifySabreUsers: boolean;
    notifyNoonlight: boolean;
  };
  OTP: string;
  OTPExpired: Date;
  resetPasswordOTP: string;
  resetPasswordOTPExpired: Date;
  sabreCommunityMember: boolean;
  isActive: boolean;
  roles: [];
  avatar: string;
  password: string;
  provider: string;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
  deviceIds: [];
  gender: string;
  hairColor: string;
  eyeColor: string;
  height: string;
  weight: string;
  skinColor: string;
  lastSeenAt: Date;
  pinCode: string;
  pinCodeSetup: boolean;

  refreshToken: string;
  refreshTokenExpiresIn: number;

  checkPassword(password: string): Promise<boolean>;
  generateResetToken(): Promise<string>;
  saveResetPasswordOTP(): Promise<string>;
  saveOTP(): Promise<string>;
  saveResetToken(): Promise<string>;
  getUserSettings(): IUserSettings;
}

export type UserList = {
  docs: IUser[];
  totalDocs: number;
  totalPages: number;
  limit: number;
  offset: number;
  page: number;
  hasPrevPage: number;
  hasNextPage: number;
  prevPage: number;
  nextPage: number;
  pagingCounter: number;
  meta: object;
};

type optionsType = {
  select: string;
  sort: any;
  populate: string;
  lean: boolean;
  offset: number;
  limit: number;
};
export interface IUserModel extends Model<IUser> {
  paginate(query: object, options: Partial<optionsType>): Promise<UserList>;
}
