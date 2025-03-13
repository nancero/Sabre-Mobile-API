import { Document } from 'mongoose';

export interface IUserSettings extends Document {
  notifyTrustedList: boolean;
  notifySabreUsers: boolean;
  notifyNoonlight: boolean;
}
